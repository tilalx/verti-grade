import { describe, expect, it } from 'vitest'
import { routeSearchFilter } from '~/utils/routeSearch'

describe('routeSearchFilter', () => {
    it('returns an empty filter for blank input', () => {
        expect(routeSearchFilter('   ')).toBe('')
    })

    it('matches text against name and setter', () => {
        expect(routeSearchFilter('Funk')).toBe(
            '(name ~ "Funk" || creator ~ "Funk")',
        )
    })

    it('keeps words and plain numbers together as one phrase', () => {
        expect(routeSearchFilter('Setter  3')).toBe(
            '(name ~ "Setter 3" || creator ~ "Setter 3")',
        )
    })

    it('treats a lone number as an exact grade', () => {
        expect(routeSearchFilter('6')).toBe('difficulty = 6')
    })

    it('treats signed grades as grade filters', () => {
        expect(routeSearchFilter('Funk 7+')).toBe(
            '(name ~ "Funk" || creator ~ "Funk") && (difficulty = 7 && (difficulty_sign = true || difficulty_sign = "+"))',
        )
        expect(routeSearchFilter('5-')).toBe(
            '(difficulty = 5 && (difficulty_sign = false || difficulty_sign = "-"))',
        )
    })

    it('escapes quotes and backslashes', () => {
        expect(routeSearchFilter('say"hi\\')).toBe(
            '(name ~ "say\\"hi\\\\" || creator ~ "say\\"hi\\\\")',
        )
    })
})
