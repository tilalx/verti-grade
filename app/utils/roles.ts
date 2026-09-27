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
