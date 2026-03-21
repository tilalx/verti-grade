/**
 * Unit tests for the pure logic extracted from app/pages/admin/comments.vue.
 *
 * Functions are defined inside <script setup> and cannot be imported, so the
 * identical logic is inlined here and verified independently.
 */
import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// toCombined – converts separate difficulty + sign fields to a display string
// ---------------------------------------------------------------------------

function toCombined(difficulty: number | null | undefined, sign: boolean | null | undefined): string | null {
    if (difficulty === null || difficulty === undefined) return null
    const suffix = sign === true ? ' +' : sign === false ? ' -' : ''
    return `${difficulty}${suffix}`
}

describe('toCombined', () => {
    it('returns "7 +" for difficulty=7, sign=true', () => {
        expect(toCombined(7, true)).toBe('7 +')
    })

    it('returns "7 -" for difficulty=7, sign=false', () => {
        expect(toCombined(7, false)).toBe('7 -')
    })

    it('returns "7" for difficulty=7, sign=null (neutral)', () => {
        expect(toCombined(7, null)).toBe('7')
    })

    it('returns "7" for difficulty=7, sign=undefined', () => {
        expect(toCombined(7, undefined)).toBe('7')
    })

    it('returns null when difficulty is null', () => {
        expect(toCombined(null, true)).toBeNull()
    })

    it('returns null when difficulty is undefined', () => {
        expect(toCombined(undefined, true)).toBeNull()
    })

    it('handles edge difficulty values like 1 and 10', () => {
        expect(toCombined(1, false)).toBe('1 -')
        expect(toCombined(10, true)).toBe('10 +')
    })
})

// ---------------------------------------------------------------------------
// fromCombined – parses a combined difficulty string back to separate fields
// ---------------------------------------------------------------------------

function fromCombined(combined: string | null | undefined): { difficulty: number | null; difficulty_sign: boolean | null } {
    if (!combined) return { difficulty: null, difficulty_sign: null }
    const num = parseInt(combined, 10)
    const trimmed = combined.trim()
    const sign = trimmed.endsWith('+') ? true : trimmed.endsWith('-') ? false : null
    return { difficulty: Number.isNaN(num) ? null : num, difficulty_sign: sign }
}

describe('fromCombined', () => {
    it('parses "7 +" → difficulty=7, sign=true', () => {
        expect(fromCombined('7 +')).toEqual({ difficulty: 7, difficulty_sign: true })
    })

    it('parses "7 -" → difficulty=7, sign=false', () => {
        expect(fromCombined('7 -')).toEqual({ difficulty: 7, difficulty_sign: false })
    })

    it('parses "7" → difficulty=7, sign=null', () => {
        expect(fromCombined('7')).toEqual({ difficulty: 7, difficulty_sign: null })
    })

    it('parses "10 +" correctly', () => {
        expect(fromCombined('10 +')).toEqual({ difficulty: 10, difficulty_sign: true })
    })

    it('returns nulls for null input', () => {
        expect(fromCombined(null)).toEqual({ difficulty: null, difficulty_sign: null })
    })

    it('returns nulls for undefined input', () => {
        expect(fromCombined(undefined)).toEqual({ difficulty: null, difficulty_sign: null })
    })

    it('returns nulls for empty string', () => {
        expect(fromCombined('')).toEqual({ difficulty: null, difficulty_sign: null })
    })

    it('round-trips with toCombined', () => {
        const cases: Array<[number, boolean | null]> = [
            [5, true], [5, false], [5, null],
            [1, true], [10, false], [3, null],
        ]
        for (const [d, s] of cases) {
            const combined = toCombined(d, s)!
            expect(fromCombined(combined)).toEqual({ difficulty: d, difficulty_sign: s })
        }
    })
})

// ---------------------------------------------------------------------------
// stats computed – total, avgRating, thisWeek, lowRated
// ---------------------------------------------------------------------------

interface Comment { rating: number | null; created: string }

function computeStats(comments: Comment[]) {
    const total = comments.length
    if (!total) return { avgRating: '—', thisWeek: 0, lowRated: 0 }

    const sum = comments.reduce((acc, c) => acc + (c.rating ?? 0), 0)
    const avgRating = (sum / total).toFixed(1)

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const thisWeek = comments.filter((c) => new Date(c.created).getTime() > weekAgo).length
    const lowRated = comments.filter((c) => c.rating !== null && c.rating <= 2).length

    return { avgRating, thisWeek, lowRated }
}

describe('computeStats', () => {
    it('returns zeroed defaults for an empty list', () => {
        expect(computeStats([])).toEqual({ avgRating: '—', thisWeek: 0, lowRated: 0 })
    })

    it('computes the correct average rating', () => {
        const comments = [
            { rating: 4, created: '2020-01-01' },
            { rating: 2, created: '2020-01-01' },
        ]
        expect(computeStats(comments).avgRating).toBe('3.0')
    })

    it('formats avgRating to one decimal place', () => {
        const comments = [
            { rating: 5, created: '2020-01-01' },
            { rating: 3, created: '2020-01-01' },
            { rating: 4, created: '2020-01-01' },
        ]
        expect(computeStats(comments).avgRating).toBe('4.0')
    })

    it('counts comments from the past 7 days as thisWeek', () => {
        const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        const oldDate = '2020-01-01'
        const comments = [
            { rating: 5, created: recentDate },
            { rating: 5, created: recentDate },
            { rating: 5, created: oldDate },
        ]
        expect(computeStats(comments).thisWeek).toBe(2)
    })

    it('counts reviews with rating ≤ 2 as lowRated', () => {
        const comments = [
            { rating: 1, created: '2020-01-01' },
            { rating: 2, created: '2020-01-01' },
            { rating: 3, created: '2020-01-01' },
            { rating: null, created: '2020-01-01' },
        ]
        expect(computeStats(comments).lowRated).toBe(2)
    })

    it('does not count null ratings as lowRated', () => {
        const comments = [{ rating: null, created: '2020-01-01' }]
        expect(computeStats(comments).lowRated).toBe(0)
    })

    it('treats null rating as 0 in average calculation', () => {
        const comments = [
            { rating: null, created: '2020-01-01' },
            { rating: 4, created: '2020-01-01' },
        ]
        // sum = 0 + 4 = 4, total = 2, avg = 2.0
        expect(computeStats(comments).avgRating).toBe('2.0')
    })
})

// ---------------------------------------------------------------------------
// filteredAndSorted – all filter + sort logic from the page computed
// ---------------------------------------------------------------------------

interface FullComment {
    id: string
    rating: number | null
    difficulty: number | null
    location: string | null
    created: string
    routeName: string
    comment: string
    userName: string
}

function filteredAndSorted(
    comments: FullComment[],
    opts: {
        search: string
        selectedLocation: string | null
        selectedDifficulty: number | null
        selectedRating: number          // 0 = all
        dateFilter: '' | 'week' | 'month'
        sortOrder: 'newest' | 'oldest' | 'highest' | 'lowest'
    },
): FullComment[] {
    const term = opts.search.toLowerCase().trim()
    const nowMs = Date.now()
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const monthMs = 30 * 24 * 60 * 60 * 1000

    let result = comments.filter((c) => {
        if (opts.selectedDifficulty !== null && c.difficulty !== opts.selectedDifficulty) return false
        if (opts.selectedLocation && c.location !== opts.selectedLocation) return false
        if (opts.selectedRating !== 0 && c.rating !== opts.selectedRating) return false
        if (opts.dateFilter === 'week' && nowMs - new Date(c.created).getTime() > weekMs) return false
        if (opts.dateFilter === 'month' && nowMs - new Date(c.created).getTime() > monthMs) return false
        if (term) {
            const hit =
                c.routeName?.toLowerCase().includes(term) ||
                c.comment?.toLowerCase().includes(term) ||
                c.userName?.toLowerCase().includes(term)
            if (!hit) return false
        }
        return true
    })

    if (opts.sortOrder === 'oldest') result = [...result].reverse()
    else if (opts.sortOrder === 'highest') result = [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    else if (opts.sortOrder === 'lowest') result = [...result].sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0))

    return result
}

const baseOpts = {
    search: '',
    selectedLocation: null,
    selectedDifficulty: null,
    selectedRating: 0,
    dateFilter: '' as const,
    sortOrder: 'newest' as const,
}

const sampleComments: FullComment[] = [
    { id: '1', rating: 5, difficulty: 7, location: 'Hanau',      created: '2024-01-01', routeName: 'Blue Wall',  comment: 'Amazing!',   userName: 'Alice'   },
    { id: '2', rating: 2, difficulty: 5, location: 'Gelnhausen', created: '2024-01-02', routeName: 'Red Slab',  comment: 'Too hard',   userName: 'Bob'     },
    { id: '3', rating: 4, difficulty: 7, location: 'Hanau',      created: '2024-01-03', routeName: 'Green Overhang', comment: 'Fun route', userName: 'Carol' },
]

describe('filteredAndSorted', () => {
    it('returns all comments with default (no) filters', () => {
        expect(filteredAndSorted(sampleComments, baseOpts)).toHaveLength(3)
    })

    it('filters by location', () => {
        const result = filteredAndSorted(sampleComments, { ...baseOpts, selectedLocation: 'Hanau' })
        expect(result).toHaveLength(2)
        expect(result.every((c) => c.location === 'Hanau')).toBe(true)
    })

    it('filters by difficulty', () => {
        const result = filteredAndSorted(sampleComments, { ...baseOpts, selectedDifficulty: 7 })
        expect(result).toHaveLength(2)
        expect(result.every((c) => c.difficulty === 7)).toBe(true)
    })

    it('filters by exact star rating', () => {
        const result = filteredAndSorted(sampleComments, { ...baseOpts, selectedRating: 5 })
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('1')
    })

    it('rating=0 means no rating filter', () => {
        expect(filteredAndSorted(sampleComments, { ...baseOpts, selectedRating: 0 })).toHaveLength(3)
    })

    it('searches by routeName (case-insensitive)', () => {
        const result = filteredAndSorted(sampleComments, { ...baseOpts, search: 'blue' })
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('1')
    })

    it('searches by comment text', () => {
        const result = filteredAndSorted(sampleComments, { ...baseOpts, search: 'too hard' })
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('2')
    })

    it('searches by userName', () => {
        const result = filteredAndSorted(sampleComments, { ...baseOpts, search: 'carol' })
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('3')
    })

    it('returns empty when search matches nothing', () => {
        expect(filteredAndSorted(sampleComments, { ...baseOpts, search: 'xyz-no-match' })).toHaveLength(0)
    })

    it('dateFilter "week" excludes old entries', () => {
        const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        const withRecent = [
            ...sampleComments,
            { id: '4', rating: 3, difficulty: 6, location: 'Hanau', created: recentDate, routeName: 'New Route', comment: 'Fresh!', userName: 'Dave' },
        ]
        const result = filteredAndSorted(withRecent, { ...baseOpts, dateFilter: 'week' })
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('4')
    })

    it('sort "oldest" reverses the newest-first order', () => {
        const result = filteredAndSorted(sampleComments, { ...baseOpts, sortOrder: 'oldest' })
        expect(result[0].id).toBe('3')
        expect(result[2].id).toBe('1')
    })

    it('sort "highest" puts the 5-star review first', () => {
        const result = filteredAndSorted(sampleComments, { ...baseOpts, sortOrder: 'highest' })
        expect(result[0].rating).toBe(5)
        expect(result[result.length - 1].rating).toBe(2)
    })

    it('sort "lowest" puts the 2-star review first', () => {
        const result = filteredAndSorted(sampleComments, { ...baseOpts, sortOrder: 'lowest' })
        expect(result[0].rating).toBe(2)
        expect(result[result.length - 1].rating).toBe(5)
    })

    it('combines location + rating filters', () => {
        const result = filteredAndSorted(sampleComments, { ...baseOpts, selectedLocation: 'Hanau', selectedRating: 5 })
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('1')
    })

    it('does not mutate the original comments array', () => {
        const original = [...sampleComments]
        filteredAndSorted(sampleComments, { ...baseOpts, sortOrder: 'lowest' })
        expect(sampleComments).toEqual(original)
    })
})

// ---------------------------------------------------------------------------
// initials – first letter of each word (up to 2 words)
// ---------------------------------------------------------------------------

function initials(name: string | null | undefined): string {
    if (!name) return '?'
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() ?? '')
        .join('')
}

describe('initials', () => {
    it('returns first letter of a single name', () => {
        expect(initials('Alice')).toBe('A')
    })

    it('returns first letters of first and last name', () => {
        expect(initials('Alice Smith')).toBe('AS')
    })

    it('uses only the first two words', () => {
        expect(initials('Alice Marie Smith')).toBe('AM')
    })

    it('uppercases letters', () => {
        expect(initials('alice smith')).toBe('AS')
    })

    it('returns "?" for null', () => {
        expect(initials(null)).toBe('?')
    })

    it('returns "?" for empty string', () => {
        expect(initials('')).toBe('?')
    })

    it('returns "?" for undefined', () => {
        expect(initials(undefined)).toBe('?')
    })
})

// ---------------------------------------------------------------------------
// avatarColor – deterministic color from name
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
    'primary', 'secondary', 'success', 'info', 'deep-purple',
    'teal', 'indigo', 'pink', 'cyan', 'orange',
]

function avatarColor(name: string | null | undefined): string {
    if (!name) return 'primary'
    const code = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

describe('avatarColor', () => {
    it('returns "primary" for null', () => {
        expect(avatarColor(null)).toBe('primary')
    })

    it('returns "primary" for undefined', () => {
        expect(avatarColor(undefined)).toBe('primary')
    })

    it('returns one of the allowed color strings', () => {
        const color = avatarColor('Alice')
        expect(AVATAR_COLORS).toContain(color)
    })

    it('is deterministic — same name always gives same color', () => {
        expect(avatarColor('Alice')).toBe(avatarColor('Alice'))
        expect(avatarColor('Bob')).toBe(avatarColor('Bob'))
    })

    it('gives different colors to different names (at least sometimes)', () => {
        const colors = new Set(['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack'].map(avatarColor))
        expect(colors.size).toBeGreaterThan(1)
    })
})

// ---------------------------------------------------------------------------
// isLong – whether a comment exceeds the collapse threshold
// ---------------------------------------------------------------------------

const LONG_THRESHOLD = 200

function isLong(text: unknown): boolean {
    return typeof text === 'string' && text.length > LONG_THRESHOLD
}

describe('isLong', () => {
    it('returns false for a short comment', () => {
        expect(isLong('Short comment')).toBe(false)
    })

    it('returns false for exactly 200 characters', () => {
        expect(isLong('a'.repeat(200))).toBe(false)
    })

    it('returns true for 201 characters', () => {
        expect(isLong('a'.repeat(201))).toBe(true)
    })

    it('returns false for null', () => {
        expect(isLong(null)).toBe(false)
    })

    it('returns false for undefined', () => {
        expect(isLong(undefined)).toBe(false)
    })

    it('returns false for an empty string', () => {
        expect(isLong('')).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// getComments error handling – abort errors are silently swallowed
// ---------------------------------------------------------------------------

describe('getComments abort handling', () => {
    it('treats isAbort=true as a non-error (no snackbar shown)', () => {
        // This mirrors the guard in getComments: if (err?.isAbort) return
        const abortError = { isAbort: true, status: 0, message: 'The request was aborted' }
        const realError = { isAbort: false, status: 500, message: 'Server error' }

        const shouldIgnore = (err: unknown) => !!(err as any)?.isAbort

        expect(shouldIgnore(abortError)).toBe(true)
        expect(shouldIgnore(realError)).toBe(false)
        expect(shouldIgnore(null)).toBe(false)
        expect(shouldIgnore(undefined)).toBe(false)
        expect(shouldIgnore(new Error('network'))).toBe(false)
    })
})
