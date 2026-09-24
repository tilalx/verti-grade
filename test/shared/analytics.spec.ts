import { describe, expect, it } from 'vitest'
import {
    buildAnalytics,
    compareGrades,
    difficultyScore,
    resolveFilters,
    type AnalyticsRating,
    type AnalyticsRoute,
} from '#shared/utils/analytics'

const NOW = new Date('2026-06-30T12:00:00Z')
const daysAgo = (days: number) =>
    new Date(NOW.getTime() - days * 86_400_000).toISOString()

function route(
    id: string,
    overrides: Partial<AnalyticsRoute> = {},
): AnalyticsRoute {
    return {
        id,
        name: id,
        difficulty: 6,
        difficulty_sign: null,
        type: 'Route',
        location: 'hall-a',
        locationName: 'Hall A',
        creator: ['Alice'],
        archived: false,
        screw_date: daysAgo(10),
        ...overrides,
    }
}

let ratingId = 0
function rating(
    routeId: string,
    overrides: Partial<AnalyticsRating> = {},
): AnalyticsRating {
    ratingId += 1
    return {
        id: `rating-${ratingId}`,
        route_id: routeId,
        rating: 4,
        difficulty: null,
        comment: '',
        created: daysAgo(5),
        ...overrides,
    }
}

const allTime = resolveFilters({ range: 'all' }, NOW)

describe('resolveFilters', () => {
    it('defaults to the last 90 days', () => {
        const filters = resolveFilters({}, NOW)
        expect(filters.from?.toISOString()).toBe(daysAgo(90))
        expect(filters.to).toEqual(NOW)
        expect(filters.includeArchived).toBe(false)
    })

    it('has no start for all time and splits list filters', () => {
        const filters = resolveFilters(
            {
                range: 'all',
                location: 'a, b',
                type: 'Boulder',
                archived: 'true',
            },
            NOW,
        )
        expect(filters.from).toBeNull()
        expect(filters.locations).toEqual(['a', 'b'])
        expect(filters.types).toEqual(['Boulder'])
        expect(filters.includeArchived).toBe(true)
    })

    it('covers whole days for a custom range and swaps reversed dates', () => {
        const filters = resolveFilters(
            { range: 'custom', from: '2026-03-10', to: '2026-03-01' },
            NOW,
        )
        expect(filters.from?.toISOString()).toBe('2026-03-01T00:00:00.000Z')
        expect(filters.to.toISOString()).toBe('2026-03-10T23:59:59.999Z')
    })
})

describe('grades', () => {
    it('scores signs a third of a grade apart', () => {
        expect(
            difficultyScore({ difficulty: 6, difficulty_sign: true }),
        ).toBeCloseTo(6.333, 2)
        expect(
            difficultyScore({ difficulty: '6', difficulty_sign: '-' }),
        ).toBeCloseTo(5.667, 2)
        expect(difficultyScore({ difficulty: null })).toBeNull()
    })

    it('orders minus before plain before plus and unknown last', () => {
        expect(['7', '6+', '?', '6', '6-'].sort(compareGrades)).toEqual([
            '6-',
            '6',
            '6+',
            '7',
            '?',
        ])
    })
})

describe('buildAnalytics', () => {
    it('counts the period and compares with the previous one', () => {
        const routes = [
            route('new', { screw_date: daysAgo(5) }),
            route('old', { screw_date: daysAgo(40) }),
            route('older', { screw_date: daysAgo(45) }),
        ]
        const ratings = [
            rating('new', { rating: 5, comment: 'great' }),
            rating('old', { rating: 3, created: daysAgo(40) }),
        ]
        const result = buildAnalytics(
            routes,
            ratings,
            resolveFilters({ range: '30d' }, NOW),
            NOW,
        )

        expect(result.summary.activeRoutes).toBe(3)
        expect(result.summary.routesSet).toEqual({ value: 1, previous: 2 })
        expect(result.summary.ratings).toEqual({ value: 1, previous: 1 })
        expect(result.summary.averageRating).toEqual({ value: 5, previous: 3 })
        expect(result.summary.comments).toEqual({ value: 1, previous: 0 })
        expect(result.summary.unratedRoutes).toBe(1)
        expect(result.bucket).toBe('day')
        expect(result.routeTimeline).toHaveLength(31)
        expect(result.routeTimeline.filter((entry) => entry.count > 0)).toEqual(
            [{ period: daysAgo(5).slice(0, 10), count: 1 }],
        )
        expect(result.latestComments.map((entry) => entry.routeName)).toEqual([
            'new',
        ])
    })

    it('has no previous values for all time', () => {
        const result = buildAnalytics([route('a')], [], allTime, NOW)
        expect(result.summary.routesSet.previous).toBeNull()
        expect(result.bucket).toBe('month')
    })

    it('filters by location and type and hides archived routes by default', () => {
        const routes = [
            route('a'),
            route('b', { location: 'hall-b', locationName: 'Hall B' }),
            route('c', { type: 'Boulder' }),
            route('d', { archived: true }),
        ]
        const scoped = buildAnalytics(
            routes,
            [rating('b')],
            resolveFilters(
                { range: 'all', location: 'hall-a', type: 'Route' },
                NOW,
            ),
            NOW,
        )
        expect(scoped.summary.activeRoutes).toBe(1)
        expect(scoped.summary.ratings.value).toBe(0)
        expect(scoped.gradeDistribution[0]!.total).toBe(1)

        const withArchived = buildAnalytics(
            routes,
            [],
            resolveFilters({ range: 'all', archived: 'true' }, NOW),
            NOW,
        )
        expect(withArchived.gradeDistribution[0]!.total).toBe(4)
    })

    it('uses archived_at for the lifespan', () => {
        const routes = [
            route('a', {
                archived: true,
                screw_date: daysAgo(40),
                archived_at: daysAgo(10),
            }),
            route('b', {
                archived: true,
                screw_date: daysAgo(30),
                archived_at: null,
            }),
        ]
        expect(
            buildAnalytics(routes, [], allTime, NOW).summary
                .averageLifespanDays,
        ).toBe(30)
    })

    it('lists routes whose grade votes deviate from the set grade', () => {
        const votes = (routeId: string, difficulty: number) =>
            [1, 2, 3].map(() => rating(routeId, { difficulty }))
        const routes = [
            route('sandbag'),
            route('soft'),
            route('fair'),
            route('few'),
        ]
        const ratings = [
            ...votes('sandbag', 7),
            ...votes('soft', 5),
            ...votes('fair', 6),
            rating('few', { difficulty: 9 }),
        ]
        const result = buildAnalytics(routes, ratings, allTime, NOW)

        expect(
            result.gradeFeedback.map(
                ({ id, setGrade, votedGrade, deviation }) => ({
                    id,
                    setGrade,
                    votedGrade,
                    deviation,
                }),
            ),
        ).toEqual([
            { id: 'sandbag', setGrade: 6, votedGrade: 7, deviation: 1 },
            { id: 'soft', setGrade: 6, votedGrade: 5, deviation: -1 },
            { id: 'fair', setGrade: 6, votedGrade: 6, deviation: 0 },
        ])
        expect(result.setters[0]).toMatchObject({
            setter: 'Alice',
            routes: 4,
            routesInPeriod: 4,
            averageDeviation: 0,
        })
    })

    it('reports grades that are under-represented compared with history', () => {
        const routes = [
            ...[1, 2, 3, 4].map((index) => route(`six-${index}`)),
            ...[1, 2, 3, 4].map((index) =>
                route(`seven-old-${index}`, { difficulty: 7, archived: true }),
            ),
            route('seven-active', { difficulty: 7 }),
        ]
        const result = buildAnalytics(routes, [], allTime, NOW)
        expect(result.gradeDistribution).toEqual([
            { grade: '6', byType: { Route: 4 }, total: 4, expected: 2.2 },
            { grade: '7', byType: { Route: 1 }, total: 1, expected: 2.8 },
        ])
    })

    it('counts stars, comments per bucket and grades per location', () => {
        const routes = [
            route('a'),
            route('b', {
                location: 'hall-b',
                locationName: 'Hall B',
                difficulty: 7,
            }),
        ]
        const ratings = [
            rating('a', { rating: 5, comment: 'nice' }),
            rating('a', { rating: 5 }),
            rating('b', { rating: 1 }),
        ]
        const result = buildAnalytics(routes, ratings, allTime, NOW)
        expect(result.ratingDistribution).toEqual([1, 0, 0, 0, 2])
        expect(result.commentTimeline).toEqual([
            { period: '2026-06', count: 1 },
        ])
        expect(result.locationGrades).toEqual([
            { location: 'Hall A', grade: '6', count: 1 },
            { location: 'Hall B', grade: '7', count: 1 },
        ])
    })

    it('ages the oldest active routes', () => {
        const result = buildAnalytics(
            [route('new'), route('old', { screw_date: daysAgo(200) })],
            [],
            allTime,
            NOW,
        )
        expect(
            result.oldestActive.map(({ id, ageDays }) => ({ id, ageDays })),
        ).toEqual([
            { id: 'old', ageDays: 200 },
            { id: 'new', ageDays: 10 },
        ])
    })

    it('keeps top and lowest rated lists disjoint', () => {
        const routes = ['a', 'b'].map((id) => route(id))
        const ratings = [
            ...[1, 2, 3].map(() => rating('a', { rating: 5 })),
            ...[1, 2, 3].map(() => rating('b', { rating: 2 })),
        ]
        const result = buildAnalytics(routes, ratings, allTime, NOW)
        expect(result.topRated.map((entry) => entry.id)).toEqual(['a', 'b'])
        expect(result.lowestRated).toEqual([])
        expect(result.ratingBaseline).toBe(3.5)
    })
})
