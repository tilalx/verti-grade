import { describe, it, expect } from 'vitest'
import {
    PROTECTED_ROLE_NAME,
    isProtectedRole,
    reassignTargets,
    defaultReassignTarget,
} from '~/utils/roles'
import type { RoleRecord } from '~/types/models'

function role(id: string, name: string, color?: string): RoleRecord {
    return { id, name, color } as RoleRecord
}

const ADMIN = role('r_admin', 'admin', '#7C4DFF')
const SETTER = role('r_setter', 'routesetter', '#26A69A')
const USER = role('r_user', 'user', '#78909C')
const ALL = [ADMIN, SETTER, USER]

describe('isProtectedRole', () => {
    it('protects only the admin role', () => {
        expect(PROTECTED_ROLE_NAME).toBe('admin')
        expect(isProtectedRole(ADMIN)).toBe(true)
        expect(isProtectedRole(SETTER)).toBe(false)
        expect(isProtectedRole(USER)).toBe(false)
    })

    it('does not protect a lookalike name', () => {
        expect(isProtectedRole(role('x', 'Admin'))).toBe(false)
        expect(isProtectedRole(role('x', 'admins'))).toBe(false)
    })
})

describe('reassignTargets', () => {
    it('offers every role but the one being deleted', () => {
        expect(reassignTargets(ALL, SETTER.id)).toEqual([ADMIN, USER])
    })

    it('is empty when the deleted role is the only one', () => {
        expect(reassignTargets([SETTER], SETTER.id)).toEqual([])
    })
})

describe('defaultReassignTarget', () => {
    it('preselects the least-privileged seeded role', () => {
        expect(defaultReassignTarget(ALL, SETTER.id)).toBe(USER.id)
    })

    it('falls back to the first remaining role when `user` is gone', () => {
        expect(defaultReassignTarget([ADMIN, SETTER], SETTER.id)).toBe(ADMIN.id)
    })

    it('returns null when nothing is left to move people to', () => {
        expect(defaultReassignTarget([SETTER], SETTER.id)).toBeNull()
    })

    it('never preselects the role being deleted', () => {
        expect(defaultReassignTarget(ALL, USER.id)).not.toBe(USER.id)
    })
})
