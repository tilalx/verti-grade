/**
 * Tests for filtering logic mirrored from app/pages/admin/comments.vue and
 * the pbFilter builder from app/pages/index.vue.
 *
 * Since these functions close over reactive refs inside Vue SFCs they cannot
 * be imported directly.  The tests inline the same pure logic so that it is
 * verified independently from the component.
 */
import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// filteredComments – logic from app/pages/admin/comments.vue
// ---------------------------------------------------------------------------

interface Comment {
    difficulty: number | null
    location: string | null
    routeName: string
    comment: string
    userName: string
}

function filteredComments(
    comments: Comment[],
    selectedDifficulty: number | null,
    selectedLocation: string | null,
    search: string,
): Comment[] {
    return comments.filter((comment) => {
        const difficultyMatch = !selectedDifficulty || comment.difficulty === selectedDifficulty
        const locationMatch = !selectedLocation || comment.location === selectedLocation
        const term = search?.toLowerCase() ?? ''
        const searchMatch =
            !term ||
            comment.routeName?.toLowerCase().includes(term) ||
            comment.comment?.toLowerCase().includes(term) ||
            comment.userName?.toLowerCase().includes(term)
        return difficultyMatch && locationMatch && searchMatch
    })
}

const sampleComments: Comment[] = [
    { difficulty: 5, location: 'Hanau', routeName: 'Blue Wave', comment: 'Great route!', userName: 'Alice' },
    { difficulty: 7, location: 'Gelnhausen', routeName: 'Red Wall', comment: 'Very hard', userName: 'Bob' },
    { difficulty: 5, location: 'Gelnhausen', routeName: 'Green Path', comment: 'Fun climb', userName: 'Carol' },
]

describe('filteredComments', () => {
    it('returns all comments when no filter is active', () => {
        expect(filteredComments(sampleComments, null, null, '')).toHaveLength(3)
    })

    it('filters by difficulty', () => {
        const result = filteredComments(sampleComments, 5, null, '')
        expect(result).toHaveLength(2)
        expect(result.every((c) => c.difficulty === 5)).toBe(true)
    })

    it('filters by location', () => {
        const result = filteredComments(sampleComments, null, 'Hanau', '')
        expect(result).toHaveLength(1)
        expect(result[0].routeName).toBe('Blue Wave')
    })

    it('combines difficulty and location filters', () => {
        const result = filteredComments(sampleComments, 5, 'Gelnhausen', '')
        expect(result).toHaveLength(1)
        expect(result[0].routeName).toBe('Green Path')
    })

    it('matches search term against routeName (case-insensitive)', () => {
        const result = filteredComments(sampleComments, null, null, 'blue')
        expect(result).toHaveLength(1)
        expect(result[0].routeName).toBe('Blue Wave')
    })

    it('matches search term against comment text', () => {
        const result = filteredComments(sampleComments, null, null, 'great')
        expect(result).toHaveLength(1)
        expect(result[0].userName).toBe('Alice')
    })

    it('matches search term against userName', () => {
        const result = filteredComments(sampleComments, null, null, 'bob')
        expect(result).toHaveLength(1)
        expect(result[0].routeName).toBe('Red Wall')
    })

    it('returns empty array when nothing matches', () => {
        expect(filteredComments(sampleComments, null, null, 'xyz-no-match')).toHaveLength(0)
    })
})

// ---------------------------------------------------------------------------
// formatDate – logic from app/pages/admin/comments.vue
// ---------------------------------------------------------------------------

function formatDate(date: string | null | undefined): string | null {
    if (!date) return null
    return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

describe('formatDate (comments page)', () => {
    it('returns null for null input', () => {
        expect(formatDate(null)).toBeNull()
    })

    it('returns null for undefined input', () => {
        expect(formatDate(undefined)).toBeNull()
    })

    it('returns null for empty string', () => {
        expect(formatDate('')).toBeNull()
    })

    it('returns a non-empty string for a valid ISO date', () => {
        const result = formatDate('2024-06-15T12:00:00Z')
        expect(typeof result).toBe('string')
        expect(result!.length).toBeGreaterThan(0)
    })
})

// ---------------------------------------------------------------------------
// pbFilter builder – logic from app/pages/index.vue
// ---------------------------------------------------------------------------

function buildPbFilter(opts: {
    selectedDifficulty: string
    selectedLocation: string
    selectedType: string
    searchRouteName: string
}): string {
    const parts = ['archived = false']
    if (opts.selectedDifficulty)
        parts.push(`difficulty = ${Number(opts.selectedDifficulty)}`)
    if (opts.selectedLocation)
        parts.push(`location = "${opts.selectedLocation}"`)
    if (opts.selectedType)
        parts.push(`type = "${opts.selectedType}"`)
    if (opts.searchRouteName.trim()) {
        const term = opts.searchRouteName.replace(/"/g, '\\"')
        parts.push(`name ~ "${term}"`)
    }
    return parts.join(' && ')
}

describe('pbFilter builder', () => {
    const empty = { selectedDifficulty: '', selectedLocation: '', selectedType: '', searchRouteName: '' }

    it('starts with archived = false when all filters are empty', () => {
        expect(buildPbFilter(empty)).toBe('archived = false')
    })

    it('appends a numeric difficulty filter', () => {
        expect(buildPbFilter({ ...empty, selectedDifficulty: '7' })).toContain('difficulty = 7')
    })

    it('appends a quoted location filter', () => {
        expect(buildPbFilter({ ...empty, selectedLocation: 'Hanau' })).toContain('location = "Hanau"')
    })

    it('appends a quoted type filter', () => {
        expect(buildPbFilter({ ...empty, selectedType: 'Boulder' })).toContain('type = "Boulder"')
    })

    it('appends a name ~ search filter', () => {
        expect(buildPbFilter({ ...empty, searchRouteName: 'wall' })).toContain('name ~ "wall"')
    })

    it('escapes double-quotes in the search term', () => {
        expect(buildPbFilter({ ...empty, searchRouteName: 'say "hi"' })).toContain('name ~ "say \\"hi\\""')
    })

    it('ignores a whitespace-only search term', () => {
        const filter = buildPbFilter({ ...empty, searchRouteName: '   ' })
        expect(filter).not.toContain('name ~')
    })

    it('combines multiple active filters with &&', () => {
        const filter = buildPbFilter({
            selectedDifficulty: '5',
            selectedLocation: 'Hanau',
            selectedType: '',
            searchRouteName: '',
        })
        expect(filter).toBe('archived = false && difficulty = 5 && location = "Hanau"')
    })
})
