/**
 * Pure logic for the route inventory (stock-take) flow.
 *
 * Lives outside `app/pages/admin/inventory.vue` so it can be imported and
 * tested directly — the previous spec re-implemented these helpers inline and
 * therefore passed no matter what the page did.
 */

export interface InventoryRoute {
    id: string
    name?: string | null
    location?: string | null
    anchor_point?: number | null
    archived?: boolean
}

export interface InventorySession {
    /** Gym site the stock-take is scoped to. `null` for a restored v1 session. */
    location: string | null
    ids: string[]
}

export const INVENTORY_STORAGE_KEY = 'inventory-scanned-route-ids'
export const INVENTORY_INSTRUCTIONS_KEY = 'inventory-instructions-seen'
export const INVENTORY_SESSION_VERSION = 2

function emptySession(): InventorySession {
    return { location: null, ids: [] }
}

function validIds(value: unknown): string[] {
    if (!Array.isArray(value)) return []
    return value.filter(
        (entry): entry is string =>
            typeof entry === 'string' && entry.length > 0,
    )
}

/**
 * Reads the stored session.
 *
 * Understands both shapes: the v1 array of ids (`["a","b"]`) written by
 * earlier builds, and the v2 record that also carries the location. A v1
 * session migrates to `location: null`, which the page resolves by asking for
 * a location before the inventory can be finished.
 *
 * Unusable content (corrupt JSON, wrong type) yields an empty session.
 * Throws only when localStorage itself is unavailable, so the caller can warn
 * that progress will not survive a reload.
 */
export function loadSession(): InventorySession {
    if (typeof localStorage === 'undefined') return emptySession()

    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY)
    if (!raw) return emptySession()

    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch {
        return emptySession()
    }

    // v1: a bare array of ids, written before the inventory was site-scoped.
    if (Array.isArray(parsed)) {
        return { location: null, ids: validIds(parsed) }
    }

    if (!parsed || typeof parsed !== 'object') return emptySession()

    const record = parsed as Record<string, unknown>
    return {
        location:
            typeof record.location === 'string' && record.location.length > 0
                ? record.location
                : null,
        ids: validIds(record.ids),
    }
}

/** Writes the session in the v2 shape, clearing the key when it is empty. */
export function persistSession(session: InventorySession): void {
    if (typeof localStorage === 'undefined') return

    if (session.ids.length === 0 && !session.location) {
        localStorage.removeItem(INVENTORY_STORAGE_KEY)
        return
    }

    localStorage.setItem(
        INVENTORY_STORAGE_KEY,
        JSON.stringify({
            v: INVENTORY_SESSION_VERSION,
            location: session.location,
            ids: session.ids,
        }),
    )
}

export function clearSession(): void {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(INVENTORY_STORAGE_KEY)
}

export function hasSeenInstructions(): boolean {
    try {
        return localStorage?.getItem(INVENTORY_INSTRUCTIONS_KEY) === '1'
    } catch {
        return false
    }
}

export function markInstructionsSeen(): void {
    try {
        localStorage?.setItem(INVENTORY_INSTRUCTIONS_KEY, '1')
    } catch {
        // Remembering this is a convenience, never worth surfacing.
    }
}

/**
 * Active routes belonging to the inventoried site.
 *
 * Without a location this is empty on purpose: every downstream consumer —
 * including the archive step — derives from it, so an unscoped session can
 * never archive routes at the other gym.
 */
export function scopedRoutes<T extends InventoryRoute>(
    routes: T[],
    location: string | null,
): T[] {
    if (!location) return []
    return routes.filter(
        (route) => route.archived !== true && route.location === location,
    )
}

/** Scoped routes that have not been scanned yet, in wall order. */
export function missingRoutes<T extends InventoryRoute>(
    routes: T[],
    scannedIds: string[],
    location: string | null,
): T[] {
    const scanned = new Set(scannedIds)
    return sortByAnchor(
        scopedRoutes(routes, location).filter(
            (route) => !scanned.has(route.id),
        ),
    )
}

/**
 * Orders routes the way you walk the wall: by anchor point, unnumbered ones
 * last, then by name.
 */
export function sortByAnchor<T extends InventoryRoute>(routes: T[]): T[] {
    return [...routes].sort((a, b) => {
        const anchorA =
            typeof a.anchor_point === 'number' ? a.anchor_point : null
        const anchorB =
            typeof b.anchor_point === 'number' ? b.anchor_point : null

        if (anchorA !== anchorB) {
            if (anchorA === null) return 1
            if (anchorB === null) return -1
            return anchorA - anchorB
        }
        return (a.name || '').localeCompare(b.name || '')
    })
}

/**
 * Active routes with no location. They are outside every scoped inventory, so
 * the page reports them rather than letting them go quietly unaccounted for.
 */
export function countUnlocated(routes: InventoryRoute[]): number {
    return routes.filter((route) => route.archived !== true && !route.location)
        .length
}

/**
 * Pulls a route id out of a scanned QR payload.
 *
 * Printed labels encode `<appUrl>/route?id=<id>` (see server/api/ui/pdf.js);
 * the bare-id form is accepted as well because PocketBase ids are 15 chars of
 * `[a-z0-9]` and some tooling encodes just that.
 */
export function extractRouteId(value: unknown): string | null {
    if (!value) return null

    const trimmed = String(value).trim()

    try {
        const id = new URL(trimmed).searchParams.get('id')
        if (id) return id
    } catch {
        // Not an absolute URL — fall through to the relative form.
    }

    const queryStart = trimmed.indexOf('?')
    if (queryStart !== -1) {
        const id = new URLSearchParams(trimmed.slice(queryStart + 1)).get('id')
        if (id) return id
    }

    if (/^[a-z0-9]{10,}$/i.test(trimmed)) return trimmed

    return null
}
