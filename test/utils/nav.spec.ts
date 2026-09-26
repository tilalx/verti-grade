import { describe, expect, it } from 'vitest'
import { safeRedirect } from '~/utils/nav'

describe('safeRedirect', () => {
    it('keeps same-origin paths', () => {
        expect(safeRedirect('/logbook')).toBe('/logbook')
        expect(safeRedirect('/route?id=abc')).toBe('/route?id=abc')
    })

    it('drops anything that could leave the site', () => {
        expect(safeRedirect('//evil.test')).toBeNull()
        expect(safeRedirect('/\\evil.test')).toBeNull()
        expect(safeRedirect('https://evil.test')).toBeNull()
        expect(safeRedirect(['/logbook'])).toBeNull()
        expect(safeRedirect(undefined)).toBeNull()
    })
})
