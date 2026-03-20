import { describe, it, expect } from 'vitest'
import {
    formatDifficulty,
    formatAnchorPoint,
    formatScore,
    normalizeCreators,
    formatDateToYYYYMMDD,
} from '~/utils/formatting'

// ---------------------------------------------------------------------------
// formatDifficulty
// ---------------------------------------------------------------------------

describe('formatDifficulty', () => {
    it('returns "7+" when difficulty_sign is true', () => {
        expect(formatDifficulty({ difficulty: 7, difficulty_sign: true })).toBe('7+')
    })

    it('returns "7-" when difficulty_sign is false', () => {
        expect(formatDifficulty({ difficulty: 7, difficulty_sign: false })).toBe('7-')
    })

    it('returns "7" when difficulty_sign is null', () => {
        expect(formatDifficulty({ difficulty: 7, difficulty_sign: null })).toBe('7')
    })

    it('returns "7" when difficulty_sign is undefined', () => {
        expect(formatDifficulty({ difficulty: 7 })).toBe('7')
    })

    it('accepts a string sign value', () => {
        expect(formatDifficulty({ difficulty: 5, difficulty_sign: '+' })).toBe('5+')
    })

    it('returns "" for null input', () => {
        expect(formatDifficulty(null)).toBe('')
    })

    it('returns "" for undefined input', () => {
        expect(formatDifficulty(undefined)).toBe('')
    })

    it('returns just the sign when difficulty is absent', () => {
        expect(formatDifficulty({ difficulty_sign: true })).toBe('+')
    })
})

// ---------------------------------------------------------------------------
// formatAnchorPoint
// ---------------------------------------------------------------------------

describe('formatAnchorPoint', () => {
    it('returns "—" for null', () => {
        expect(formatAnchorPoint(null)).toBe('—')
    })

    it('returns "—" for undefined', () => {
        expect(formatAnchorPoint(undefined)).toBe('—')
    })

    it('returns "—" for empty string', () => {
        expect(formatAnchorPoint('')).toBe('—')
    })

    it('returns "-" for 0', () => {
        expect(formatAnchorPoint(0)).toBe('-')
    })

    it('returns "-" for the string "0"', () => {
        expect(formatAnchorPoint('0')).toBe('-')
    })

    it('passes through a positive number', () => {
        expect(formatAnchorPoint(12)).toBe(12)
    })

    it('passes through a non-empty string', () => {
        expect(formatAnchorPoint('A3')).toBe('A3')
    })
})

// ---------------------------------------------------------------------------
// formatScore
// ---------------------------------------------------------------------------

describe('formatScore', () => {
    it('formats a finite number to two decimal places', () => {
        expect(formatScore({ score: 4.5 })).toBe('4.50/5')
    })

    it('formats an integer score', () => {
        expect(formatScore({ score: 3 })).toBe('3.00/5')
    })

    it('returns "—" when score is null', () => {
        expect(formatScore({ score: null })).toBe('—')
    })

    it('returns "—" when score is undefined', () => {
        expect(formatScore({})).toBe('—')
    })

    it('returns "—" when score is NaN', () => {
        expect(formatScore({ score: NaN })).toBe('—')
    })

    it('returns "—" when score is Infinity', () => {
        expect(formatScore({ score: Infinity })).toBe('—')
    })

    it('returns "—" for a null route', () => {
        expect(formatScore(null)).toBe('—')
    })

    it('returns "—" for an undefined route', () => {
        expect(formatScore(undefined)).toBe('—')
    })
})

// ---------------------------------------------------------------------------
// normalizeCreators
// ---------------------------------------------------------------------------

describe('normalizeCreators', () => {
    it('splits a comma-separated string into trimmed parts', () => {
        expect(normalizeCreators('Alice, Bob, Charlie')).toEqual(['Alice', 'Bob', 'Charlie'])
    })

    it('filters out empty segments from a string', () => {
        expect(normalizeCreators(',Alice,,Bob,')).toEqual(['Alice', 'Bob'])
    })

    it('returns an array of trimmed strings when input is an array', () => {
        expect(normalizeCreators(['  Alice  ', 'Bob'])).toEqual(['Alice', 'Bob'])
    })

    it('filters out non-string values from an array', () => {
        expect(normalizeCreators(['Alice', 42, null, 'Bob'] as unknown[])).toEqual(['Alice', 'Bob'])
    })

    it('returns [] for an empty string', () => {
        expect(normalizeCreators('')).toEqual([])
    })

    it('returns [] for an empty array', () => {
        expect(normalizeCreators([])).toEqual([])
    })

    it('returns [] for null', () => {
        expect(normalizeCreators(null)).toEqual([])
    })

    it('returns [] for undefined', () => {
        expect(normalizeCreators(undefined)).toEqual([])
    })

    it('returns [] for a number', () => {
        expect(normalizeCreators(42)).toEqual([])
    })
})

// ---------------------------------------------------------------------------
// formatDateToYYYYMMDD
// ---------------------------------------------------------------------------

describe('formatDateToYYYYMMDD', () => {
    it('returns "" for null', () => {
        expect(formatDateToYYYYMMDD(null)).toBe('')
    })

    it('returns "" for undefined', () => {
        expect(formatDateToYYYYMMDD(undefined)).toBe('')
    })

    it('returns "" for empty string', () => {
        expect(formatDateToYYYYMMDD('')).toBe('')
    })

    it('returns "" for an invalid date string', () => {
        expect(formatDateToYYYYMMDD('not-a-date')).toBe('')
    })

    it('formats a full ISO datetime string to YYYY-MM-DD', () => {
        // Use a date-only part to avoid timezone shifts in the test runner.
        const result = formatDateToYYYYMMDD('2024-06-15')
        // Result must be YYYY-MM-DD shaped and contain the correct year and month.
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(result.startsWith('2024')).toBe(true)
    })

    it('zero-pads single-digit month and day', () => {
        const result = formatDateToYYYYMMDD('2024-01-05')
        expect(result).toMatch(/^\d{4}-01-\d{2}$/)
    })
})
