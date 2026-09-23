import { describe, it, expect } from 'vitest'
import {
    COMBINED_DIFFICULTIES,
    DIFFICULTY_LEVELS,
    parseCombinedDifficulty,
    toCombinedDifficulty,
} from '~/utils/routes'

describe('difficulty scale', () => {
    it('spans levels 1 to 10', () => {
        expect(DIFFICULTY_LEVELS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    })

    it('offers minus, plain and plus per level', () => {
        expect(COMBINED_DIFFICULTIES.slice(0, 3)).toEqual(['1 -', '1', '1 +'])
        expect(COMBINED_DIFFICULTIES).toHaveLength(30)
    })
})

describe('toCombinedDifficulty', () => {
    it.each([
        [7, true, '7 +'],
        [7, '+', '7 +'],
        [7, false, '7 -'],
        [7, '-', '7 -'],
        [7, null, '7'],
        ['7', '', '7'],
        [null, true, null],
    ] as const)('%s with sign %s → %s', (difficulty, sign, expected) => {
        expect(toCombinedDifficulty(difficulty, sign)).toBe(expected)
    })
})

describe('parseCombinedDifficulty', () => {
    it('round-trips every combined value', () => {
        for (const combined of COMBINED_DIFFICULTIES) {
            const { difficulty, difficulty_sign } =
                parseCombinedDifficulty(combined)
            expect(toCombinedDifficulty(difficulty, difficulty_sign)).toBe(
                combined,
            )
        }
    })

    it('returns nulls for empty input', () => {
        expect(parseCombinedDifficulty(null)).toEqual({
            difficulty: null,
            difficulty_sign: null,
        })
    })
})
