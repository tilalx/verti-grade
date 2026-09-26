import { describe, it, expect } from 'vitest'
import {
    GRADE_SYSTEMS,
    GRADE_TABLES,
    canonicalGrade,
    formatGrade,
    gradeKey,
    gradeKeyIndex,
    gradeIndex,
    gradeLabels,
    nearestGrade,
    resolveImportedGrading,
} from '#shared/utils/grades'

describe('grade tables', () => {
    it.each(GRADE_SYSTEMS)('%s is strictly ascending and unique', (system) => {
        const indexes = GRADE_TABLES[system].map(([, index]) => index)
        const sorted = [...indexes].sort((a, b) => a - b)
        expect(indexes).toEqual(sorted)
        expect(new Set(indexes).size).toBe(indexes.length)
        expect(new Set(gradeLabels(system)).size).toBe(indexes.length)
    })

    it('covers every IRCRA level of the chart', () => {
        expect(GRADE_TABLES.french.map(([, index]) => index)).toEqual(
            Array.from({ length: 32 }, (_, i) => i + 1),
        )
        expect(gradeIndex('yds', '5.15c')).toBe(32)
        expect(gradeIndex('uiaa', '12')).toBe(32.1)
        expect(gradeIndex('v', 'V16')).toBe(31.9)
        expect(gradeIndex('font', '8C+')).toBe(31.9)
    })

    it('aligns common equivalents across scales', () => {
        expect(gradeIndex('french', '6a')).toBe(gradeIndex('yds', '5.10b'))
        expect(gradeIndex('french', '7a')).toBe(gradeIndex('yds', '5.11d'))
        expect(nearestGrade('french', gradeIndex('uiaa', '7')!)).toBe('6b')
        expect(nearestGrade('v', gradeIndex('font', '7A')!)).toBe('V6')
    })
})

describe('gradeIndex', () => {
    it('matches case and whitespace insensitively', () => {
        expect(gradeIndex('french', ' 6A+ ')).toBe(12)
        expect(gradeIndex('font', '7a')).toBe(20.3)
    })

    it('returns null for unknown systems or grades', () => {
        expect(gradeIndex('ewbank', '20')).toBeNull()
        expect(gradeIndex('uiaa', '6a')).toBeNull()
        expect(gradeIndex('uiaa', null)).toBeNull()
    })
})

describe('nearestGrade', () => {
    it('picks the closest label on the target scale', () => {
        expect(nearestGrade('font', 16.2)).toBe('6A+')
        expect(nearestGrade('v', 20)).toBe('V6')
    })
})

describe('canonicalGrade', () => {
    it('returns the table spelling', () => {
        expect(canonicalGrade('font', '6a+')).toBe('6A+')
        expect(canonicalGrade('v', 'v5')).toBe('V5')
        expect(canonicalGrade('uiaa', '6a')).toBeNull()
    })
})

describe('gradeKey', () => {
    it('adds the scale only when asked', () => {
        const font = { grade: '5', grade_system: 'font' }
        expect(gradeKey(font, false)).toBe('5')
        expect(gradeKey(font, true)).toBe('5 · Font')
        expect(gradeKey({ grade: '' }, true)).toBe('?')
    })

    it('orders keys by the scale they name', () => {
        expect(gradeKeyIndex('5 · Font')).toBe(14.2)
        expect(gradeKeyIndex('5 · UIAA')).toBe(7.4)
        expect(gradeKeyIndex('?')).toBe(Number.MAX_SAFE_INTEGER)
    })
})

describe('formatGrade', () => {
    it('returns the stored label', () => {
        expect(formatGrade({ grade: ' 6a+ ' })).toBe('6a+')
        expect(formatGrade(null)).toBe('')
    })
})

describe('resolveImportedGrading', () => {
    it('stores the canonical label for new-format grades', () => {
        expect(
            resolveImportedGrading(
                { grade: '6A', grade_system: 'french' },
                'uiaa',
            ),
        ).toEqual({ grade: '6a', grade_system: 'french', grade_index: 11 })
    })

    it('keeps valid new-format grades', () => {
        expect(
            resolveImportedGrading(
                { grade: '5.11a', grade_system: 'yds' },
                'french',
            ),
        ).toEqual({ grade: '5.11a', grade_system: 'yds', grade_index: 14 })
    })

    it('reads legacy UIAA routes as UIAA', () => {
        expect(
            resolveImportedGrading(
                { difficulty: 7, difficulty_sign: true },
                'french',
            ),
        ).toEqual({ grade: '7+', grade_system: 'uiaa', grade_index: 14.6 })
    })

    it('converts legacy UIAA boulders to the boulder scale', () => {
        expect(
            resolveImportedGrading(
                { difficulty: 8, difficulty_sign: null },
                'font',
            ),
        ).toEqual({ grade: '6B', grade_system: 'font', grade_index: 17.1 })
    })

    it('maps legacy UIAA grades missing from the chart to the nearest one', () => {
        expect(
            resolveImportedGrading(
                { difficulty: 2, difficulty_sign: true },
                'uiaa',
            ),
        ).toEqual({ grade: '2', grade_system: 'uiaa', grade_index: 1.9 })
    })

    it('returns an empty grade when nothing matches', () => {
        expect(resolveImportedGrading({}, 'uiaa')).toEqual({
            grade: '',
            grade_system: 'uiaa',
            grade_index: null,
        })
    })
})
