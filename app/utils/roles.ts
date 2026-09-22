import type { RoleRecord, RecordId } from '~/types/models'

/**
 * The admin role is the client-side permission safety net
 * (`usePermissions.can()` short-circuits on it) and the one role whose
 * permissions cannot be revoked, so it must never be deleted. The server
 * enforces this too — `roles.deleteRule` carries `name != "admin"` — this is
 * only what hides the button.
 */
export const PROTECTED_ROLE_NAME = 'admin'

export function isProtectedRole(role: Pick<RoleRecord, 'name'>): boolean {
    return role.name === PROTECTED_ROLE_NAME
}

/** Roles a deleted role's holders can be moved to: every other role. */
export function reassignTargets(
    roles: RoleRecord[],
    deletingId: RecordId,
): RoleRecord[] {
    return roles.filter((r) => r.id !== deletingId)
}

/**
 * Preselect the plain `user` role, the least-privileged of the seeded three, so
 * the default answer to "where do these people go" never widens anyone's
 * access. Falls back to the first remaining role when `user` has been renamed
 * or removed.
 */
export function defaultReassignTarget(
    roles: RoleRecord[],
    deletingId: RecordId,
): RecordId | null {
    const targets = reassignTargets(roles, deletingId)
    const fallback = targets.find((r) => r.name === 'user')
    return fallback?.id ?? targets[0]?.id ?? null
}

/**
 * `v-color-picker` can hand back `#RRGGBBAA` (its hex mode keeps the alpha
 * channel once the model has ever carried one), and the `roles.color` field
 * only accepts `^#[0-9a-fA-F]{6}$`. Drop the alpha and normalise the case so a
 * picked color never fails validation server-side. Anything unrecognisable
 * becomes `''`, which the UI reads as "no color".
 */
export function toHex6(value: string | null | undefined): string {
    const match = /^#?([0-9a-fA-F]{6})(?:[0-9a-fA-F]{2})?$/.exec(
        (value ?? '').trim(),
    )
    return match ? `#${match[1].toUpperCase()}` : ''
}

/**
 * Black or white, whichever the WCAG contrast formula says is more readable on
 * `hex`. A role color is chosen by an admin, so it cannot be trusted to be
 * legible as text: painting the label *in* the color (Vuetify's `tonal` chip)
 * leaves a mid-tone hue like #7C4DFF unreadable on a dark surface. The color
 * becomes the background instead, and this picks a foreground that works in
 * both themes.
 */
export function readableTextOn(hex: string | null | undefined): string {
    const normalized = toHex6(hex)
    if (!normalized) return 'inherit'

    const channel = (offset: number) => {
        const c = parseInt(normalized.slice(offset, offset + 2), 16) / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }

    const luminance =
        0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)

    // Contrast against white is 1.05/(L+0.05), against black (L+0.05)/0.05.
    // They cross at L ≈ 0.1791.
    return 1.05 / (luminance + 0.05) > (luminance + 0.05) / 0.05
        ? '#FFFFFF'
        : '#000000'
}
