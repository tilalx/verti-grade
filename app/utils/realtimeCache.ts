import type {
    RatingRecord,
    RouteRecord,
    RouteScoreRecord,
    WallRecord,
} from '~/types/models'

export const cacheKeys = {
    overviewRoutes: 'overview-routes',
    overviewWalls: 'overview-walls',
    mapRoutes: (locationId: string) => `map-routes:${locationId}`,
    mapWalls: (locationId: string) => `map-walls:${locationId}`,
    routesList: 'routes-list',
    route: (routeId: string) => `route:${routeId}`,
    ratings: (routeId: string) => `ratings:${routeId}`,
    ratingsSheet: (routeId: string) => `ratings-sheet:${routeId}`,
    unplacedRoutes: 'unplaced-routes',
}

export type InScope<T> = (record: T) => boolean | null
export type RowsData<T> = T[] | { items: T[]; totalItems: number }
export type RatingLedger = Map<string, RatingRecord | null>
export interface RatingChange {
    added: RatingRecord | null
    removed: RatingRecord | null
}

export const NEW_ROUTE_SCORE = { average_rating: null, ratings_count: 0 }

function keySuffix(key: string, prefix: string) {
    return key.startsWith(prefix) ? key.slice(prefix.length) : undefined
}

export function routeRowsScope(key: string): InScope<RouteRecord> | undefined {
    if (key === cacheKeys.overviewRoutes) return () => true
    if (key === cacheKeys.routesList) return () => null
    const locationId = keySuffix(key, cacheKeys.mapRoutes(''))
    if (locationId !== undefined)
        return (route) => route.location === locationId
}

export function wallsScope(key: string): InScope<WallRecord> | undefined {
    if (key === cacheKeys.overviewWalls) return () => true
    const locationId = keySuffix(key, cacheKeys.mapWalls(''))
    if (locationId !== undefined) return (wall) => wall.location === locationId
}

export function ratingsRouteId(key: string) {
    return (
        keySuffix(key, cacheKeys.ratings('')) ??
        keySuffix(key, cacheKeys.ratingsSheet(''))
    )
}

export function detailRouteId(key: string) {
    return keySuffix(key, cacheKeys.route(''))
}

export function isLiveKey(key: string) {
    return (
        key === cacheKeys.unplacedRoutes ||
        !!routeRowsScope(key) ||
        !!wallsScope(key) ||
        ratingsRouteId(key) !== undefined ||
        detailRouteId(key) !== undefined
    )
}

export function rowsOf<T>(data: RowsData<T>) {
    return Array.isArray(data) ? data : data.items
}

export function mapRows<T>(
    data: RowsData<T>,
    patch: (rows: T[]) => T[],
): RowsData<T> {
    if (Array.isArray(data)) return patch(data)
    const items = patch(data.items)
    return items === data.items ? data : { ...data, items }
}

export function upsertById<T extends { id: string }>(
    list: T[],
    record: T,
    position: 'start' | 'end' = 'end',
): T[] {
    if (list.some((item) => item.id === record.id))
        return list.map((item) =>
            item.id === record.id ? { ...item, ...record } : item,
        )
    return position === 'start' ? [record, ...list] : [...list, record]
}

export function removeById<T extends { id: string }>(
    list: T[],
    id: string,
): T[] {
    return list.some((item) => item.id === id)
        ? list.filter((item) => item.id !== id)
        : list
}

export function patchList<T extends { id: string }>(
    list: T[],
    record: T,
    keep: boolean | null,
    insertDefaults: Partial<T> = {},
): T[] {
    if (keep === false) return removeById(list, record.id)
    if (list.some((item) => item.id === record.id))
        return upsertById(list, record)
    return keep ? [...list, { ...insertDefaults, ...record }] : list
}

function stars(rating: Pick<RatingRecord, 'rating'> | null) {
    return rating?.rating && rating.rating > 0 ? rating.rating : 0
}

type Score = Pick<RouteScoreRecord, 'average_rating' | 'ratings_count'>

export function shiftScore(score: Score, added: number, removed = 0): Score {
    const count = Number(score.ratings_count ?? 0)
    const sum = Number(score.average_rating ?? 0) * count
    const nextCount = count + (added ? 1 : 0) - (removed ? 1 : 0)
    if (nextCount <= 0) return { average_rating: null, ratings_count: 0 }
    return {
        average_rating: (sum + added - removed) / nextCount,
        ratings_count: nextCount,
    }
}

export function applyRatingChange<T extends RouteScoreRecord>(
    rows: T[],
    change: RatingChange,
): T[] {
    let changed = false
    const next = rows.map((row) => {
        const added =
            change.added?.route_id === row.id ? stars(change.added) : 0
        const removed =
            change.removed?.route_id === row.id ? stars(change.removed) : 0
        if (!added && !removed) return row
        changed = true
        return { ...row, ...shiftScore(row, added, removed) }
    })
    return changed ? next : rows
}

export function trackRating(
    ledger: RatingLedger,
    action: string,
    rating: RatingRecord,
    cachedPrevious?: RatingRecord,
): RatingChange | 'unknown' | null {
    if (action === 'create') {
        if (ledger.has(rating.id)) return null
        ledger.set(rating.id, rating)
        return { added: rating, removed: null }
    }
    if (action === 'delete') {
        if (ledger.get(rating.id) === null) return null
        ledger.set(rating.id, null)
        return { added: null, removed: rating }
    }
    const previous = ledger.get(rating.id) ?? cachedPrevious
    ledger.set(rating.id, rating)
    return previous ? { added: rating, removed: previous } : 'unknown'
}

export function coalesce(task: () => Promise<unknown>, delayMs = 1000) {
    let timer: ReturnType<typeof setTimeout> | undefined
    return () => {
        if (timer) return
        timer = setTimeout(
            () => {
                timer = undefined
                task().catch(() => {})
            },
            delayMs + Math.random() * delayMs,
        )
    }
}

const RECORD_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function newRecordId(length = 15) {
    const bytes = crypto.getRandomValues(new Uint8Array(length))
    return Array.from(
        bytes,
        (byte) => RECORD_ID_ALPHABET[byte % RECORD_ID_ALPHABET.length],
    ).join('')
}
