import { describe, expect, it } from 'vitest'

const { isBlankDate } = require('../../pocketbase/pb_hooks/utils/reports.js')

describe('isBlankDate', () => {
    it('treats an unset PocketBase DateTime as blank', () => {
        const unset = { isZero: () => true, toString: () => '' }

        expect(!!unset).toBe(true) // this is what fooled the old guard
        expect(isBlankDate(unset)).toBe(true)
    })

    it('treats a stamped DateTime as set', () => {
        const stamped = {
            isZero: () => false,
            toString: () => '2026-09-21 10:00:00.000Z',
        }

        expect(isBlankDate(stamped)).toBe(false)
    })

    it('handles the empty and nullish forms', () => {
        expect(isBlankDate('')).toBe(true)
        expect(isBlankDate(null)).toBe(true)
        expect(isBlankDate(undefined)).toBe(true)
    })

    it('falls back to the string form when isZero is absent', () => {
        expect(isBlankDate({ toString: () => '' })).toBe(true)
        expect(isBlankDate('2026-09-21 10:00:00.000Z')).toBe(false)
    })
})
