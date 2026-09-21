import { describe, expect, it } from 'vitest'

// Plain CommonJS with no PocketBase globals at module scope, so it imports
// straight into vitest.
const { isBlankDate } = require('../../pocketbase/pb_hooks/utils/reports.js')

/**
 * PocketBase hands back a DateTime OBJECT for an unset date field, and an
 * object is truthy in JS. The Art. 16(5) decision hook guarded on
 * `record.get('notified_at')` directly, so every report looked "already
 * notified" and the decision notice was never sent to the reporter.
 */
describe('isBlankDate', () => {
    it('treats an unset PocketBase DateTime as blank', () => {
        // Shape confirmed against the running runtime: truthy object, isZero().
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
