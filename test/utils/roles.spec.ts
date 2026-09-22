import { describe, it, expect } from 'vitest'
import {
    PROTECTED_ROLE_NAME,
    isProtectedRole,
    reassignTargets,
    defaultReassignTarget,
    toHex6,
    readableTextOn,
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

describe('toHex6', () => {
    it('normalises case and keeps six digits', () => {
        expect(toHex6('#7c4dff')).toBe('#7C4DFF')
        expect(toHex6('7C4DFF')).toBe('#7C4DFF')
        expect(toHex6('  #26a69a  ')).toBe('#26A69A')
    })

    it('drops the alpha channel the color picker can append', () => {
        // The roles.color field only accepts ^#[0-9a-fA-F]{6}$, so an 8-digit
        // value coming out of v-color-picker would be rejected server-side.
        expect(toHex6('#7C4DFFFF')).toBe('#7C4DFF')
        expect(toHex6('#7c4dff80')).toBe('#7C4DFF')
    })

    it('treats anything unusable as no color', () => {
        expect(toHex6('')).toBe('')
        expect(toHex6(null)).toBe('')
        expect(toHex6(undefined)).toBe('')
        expect(toHex6('#fff')).toBe('')
        expect(toHex6('rebeccapurple')).toBe('')
        expect(toHex6('#12345g')).toBe('')
    })
})

describe('readableTextOn', () => {
    // A role color is admin-chosen, so the label must stay legible whatever
    // hue lands in the field — this is what replaced painting the text in the
    // color itself, which left #7C4DFF unreadable on a dark surface.
    it('puts white on dark backgrounds', () => {
        expect(readableTextOn('#7C4DFF')).toBe('#FFFFFF')
        expect(readableTextOn('#000000')).toBe('#FFFFFF')
        expect(readableTextOn('#8D6E63')).toBe('#FFFFFF')
    })

    it('puts black on light backgrounds', () => {
        expect(readableTextOn('#FFFFFF')).toBe('#000000')
        expect(readableTextOn('#9CCC65')).toBe('#000000')
        expect(readableTextOn('#FFA726')).toBe('#000000')
    })

    it('defers to the theme when there is no color', () => {
        expect(readableTextOn('')).toBe('inherit')
        expect(readableTextOn(null)).toBe('inherit')
        expect(readableTextOn('not-a-color')).toBe('inherit')
    })

    it('meets the WCAG AA 4.5:1 ratio for every swatch in the palette', () => {
        const palette = [
            '#EF5350',
            '#EC407A',
            '#AB47BC',
            '#7C4DFF',
            '#5C6BC0',
            '#42A5F5',
            '#26A69A',
            '#66BB6A',
            '#9CCC65',
            '#FFA726',
            '#8D6E63',
            '#78909C',
        ]

        const luminance = (hex: string) => {
            const chan = (o: number) => {
                const c = parseInt(hex.slice(o, o + 2), 16) / 255
                return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
            }
            return 0.2126 * chan(1) + 0.7152 * chan(3) + 0.0722 * chan(5)
        }

        for (const hex of palette) {
            const bg = luminance(hex)
            const fg = readableTextOn(hex) === '#FFFFFF' ? 1 : 0
            const ratio = (Math.max(bg, fg) + 0.05) / (Math.min(bg, fg) + 0.05)
            expect(ratio, `${hex} contrast`).toBeGreaterThanOrEqual(4.5)
        }
    })
})
