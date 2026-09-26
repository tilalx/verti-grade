import { describe, it, expect } from 'vitest'
import {
    BRITISH_TECH_LANES,
    EWBANK,
    FEMALE_LEVELS,
    MALE_LEVELS,
    WATTS,
} from '~/utils/gradeReference'

describe('grade reference columns', () => {
    it('covers the chart without gaps for both climber levels', () => {
        for (const levels of [MALE_LEVELS, FEMALE_LEVELS]) {
            expect(levels[0]![1]).toBe(0.5)
            expect(levels.at(-1)![2]).toBe(32.5)
            levels.slice(1).forEach(([, from], i) => {
                expect(from).toBe(levels[i]![2])
            })
        }
        expect(MALE_LEVELS[1]).toEqual(['intermediate', 9.5, 17.5])
        expect(FEMALE_LEVELS[1]).toEqual(['intermediate', 9.5, 14.5])
    })

    it('matches the chart end points', () => {
        expect(EWBANK[0]).toEqual(['4', 1])
        expect(EWBANK.at(-1)).toEqual(['38', 32.2])
        expect(WATTS[0]).toEqual(['0.00', 6])
        expect(WATTS.at(-1)).toEqual(['6.50', 32])
    })

    it('keeps British Tech bands ascending within each lane', () => {
        for (const lane of BRITISH_TECH_LANES) {
            lane.forEach(([, from, to], i) => {
                expect(to).toBeGreaterThan(from)
                if (i > 0) expect(from).toBeGreaterThan(lane[i - 1]![2])
            })
        }
    })
})
