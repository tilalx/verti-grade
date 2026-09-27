import { describe, expect, it } from 'vitest'
import { normalizeHexColor } from '#shared/utils/color'

describe('normalizeHexColor', () => {
    it('drops the alpha channel of 8-digit hex colours', () => {
        expect(normalizeHexColor('#DA5307F6')).toBe('#DA5307')
    })

    it('uppercases and adds the hash to 6-digit colours', () => {
        expect(normalizeHexColor('da5307')).toBe('#DA5307')
    })

    it('falls back to grey for anything else', () => {
        expect(normalizeHexColor('')).toBe('#9E9E9E')
        expect(normalizeHexColor(null)).toBe('#9E9E9E')
        expect(normalizeHexColor('red')).toBe('#9E9E9E')
    })
})
