import type { RoleRecord, RecordId } from '~/types/models'

export const PROTECTED_ROLE_NAME = 'admin'

export function isProtectedRole(role: Pick<RoleRecord, 'name'>): boolean {
    return role.name === PROTECTED_ROLE_NAME
}

export function reassignTargets(
    roles: RoleRecord[],
    deletingId: RecordId,
): RoleRecord[] {
    return roles.filter((r) => r.id !== deletingId)
}

export function defaultReassignTarget(
    roles: RoleRecord[],
    deletingId: RecordId,
): RecordId | null {
    const targets = reassignTargets(roles, deletingId)
    const fallback = targets.find((r) => r.name === 'user')
    return fallback?.id ?? targets[0]?.id ?? null
}

export function toHex6(value: string | null | undefined): string {
    const match = /^#?([0-9a-fA-F]{6})(?:[0-9a-fA-F]{2})?$/.exec(
        (value ?? '').trim(),
    )
    return match ? `#${match[1].toUpperCase()}` : ''
}

export function readableTextOn(hex: string | null | undefined): string {
    const normalized = toHex6(hex)
    if (!normalized) return 'inherit'

    const channel = (offset: number) => {
        const c = parseInt(normalized.slice(offset, offset + 2), 16) / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }

    const luminance =
        0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)

    return 1.05 / (luminance + 0.05) > (luminance + 0.05) / 0.05
        ? '#FFFFFF'
        : '#000000'
}
