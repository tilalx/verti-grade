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

    it('treats a lone number as a grade level with its signs', () => {
        expect(routeSearchFilter('6')).toBe(
            '(grade = "6-" || grade = "6" || grade = "6+")',
        )
    })

    it('treats signed grades as grade filters', () => {
        expect(routeSearchFilter('Funk 7+')).toBe(
            '(name ~ "Funk" || creator ~ "Funk") && grade = "7+"',
        )
        expect(routeSearchFilter('5-')).toBe('grade = "5-"')
    })

    it('recognises grades of every scale, case-insensitively', () => {
        expect(routeSearchFilter('Funk 5.10a')).toBe(
            '(name ~ "Funk" || creator ~ "Funk") && grade = "5.10a"',
        )
        expect(routeSearchFilter('v5')).toBe('grade = "V5"')
        expect(routeSearchFilter('6a+')).toBe(
            '(grade = "6a+" || grade = "6A+")',
        )
    })

    it('escapes quotes and backslashes', () => {
        expect(routeSearchFilter('say"hi\\')).toBe(
            '(name ~ "say\\"hi\\\\" || creator ~ "say\\"hi\\\\")',
        )
    })
})
