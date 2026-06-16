import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useClimbingAnalytics } from '~/composables/useClimbingAnalytics.ts'

const fetchMock = vi.fn()

vi.mock('nuxt/app', () => ({
    useRequestFetch: () => fetchMock,
}))

const sampleResponse = {
    summary: {
        totalRoutes: 10,
        activeRoutes: 8,
        averageDifficulty: 5.5,
        totalComments: 20,
        generatedAt: '2024-01-01T00:00:00Z',
    },
    difficultyDistribution: [
        { grade: '5', count: 3 },
        { grade: '6+', count: 2 },
    ],
    routeSetters: [{ setter: 'Alice', count: 5 }],
    routeTimeline: [{ period: '2024-01-01', count: 2 }],
    commentTimeline: [{ period: '2024-01-01', count: 4 }],
    latestComments: [
        {
            id: 'c1',
            routeId: 'r1',
            routeName: 'Test Route',
            rating: 4,
            comment: 'Great!',
            created: '2024-01-01T00:00:00Z',
        },
    ],
    latestRoutes: [
        {
            id: 'r1',
            name: 'Test Route',
            difficulty: '5+',
            location: 'Wall A',
            screwDate: '2024-01-01',
            creators: ['Alice'],
            type: 'Route',
        },
    ],
}

describe('useClimbingAnalytics', () => {
    beforeEach(() => {
        fetchMock.mockReset()
        globalThis.__POCKETBASE_CLIENT__ = {
            authStore: { token: 'test-token' },
        }
    })

    it('starts with loading=false and no data', () => {
        const { loading, error, hasData } = useClimbingAnalytics()

        expect(loading.value).toBe(false)
        expect(error.value).toBe(false)
        expect(hasData.value).toBe(false)
    })

    it('loads analytics data successfully', async () => {
        fetchMock.mockResolvedValue(sampleResponse)
        const { load, hasData, summary, loading } = useClimbingAnalytics()

        await load()

        expect(loading.value).toBe(false)
        expect(hasData.value).toBe(true)
        expect(summary.value.totalRoutes).toBe(10)
        expect(summary.value.activeRoutes).toBe(8)
        expect(summary.value.totalComments).toBe(20)
    })

    it('exposes all data fields after a successful load', async () => {
        fetchMock.mockResolvedValue(sampleResponse)
        const { load, difficultyDistribution, routeSetters, latestRoutes, latestComments } =
            useClimbingAnalytics()

        await load()

        expect(difficultyDistribution.value).toHaveLength(2)
        expect(routeSetters.value[0].setter).toBe('Alice')
        expect(latestRoutes.value[0].name).toBe('Test Route')
        expect(latestComments.value[0].comment).toBe('Great!')
    })

    it('sets error flag and clears data when the request fails', async () => {
        fetchMock.mockRejectedValue(new Error('Network failure'))
        const { load, error, hasData } = useClimbingAnalytics()

        await load()

        expect(error.value).toBe(true)
        expect(hasData.value).toBe(false)
    })

    it('sets error flag when API returns an error response', async () => {
        fetchMock.mockRejectedValue({ data: { message: 'Unauthorized' } })
        const { load, error } = useClimbingAnalytics()

        await load()

        expect(error.value).toBe(true)
    })

    it('normalizes NaN averageDifficulty to 0', async () => {
        fetchMock.mockResolvedValue({
            ...sampleResponse,
            summary: { ...sampleResponse.summary, averageDifficulty: NaN },
        })
        const { load, summary } = useClimbingAnalytics()

        await load()

        expect(summary.value.averageDifficulty).toBe(0)
    })

    it('rounds averageDifficulty to 2 decimal places', async () => {
        fetchMock.mockResolvedValue({
            ...sampleResponse,
            summary: { ...sampleResponse.summary, averageDifficulty: 5.123456 },
        })
        const { load, summary } = useClimbingAnalytics()

        await load()

        expect(summary.value.averageDifficulty).toBe(5.12)
    })

    it('filters out falsy items from array fields', async () => {
        fetchMock.mockResolvedValue({
            ...sampleResponse,
            routeSetters: [{ setter: 'Alice', count: 3 }, null, { setter: 'Bob', count: 1 }],
        })
        const { load, routeSetters } = useClimbingAnalytics()

        await load()

        expect(routeSetters.value).toHaveLength(2)
    })

    it('handles missing optional fields in route data gracefully', async () => {
        fetchMock.mockResolvedValue({
            ...sampleResponse,
            latestRoutes: [
                { id: 'r2', name: 'Sparse Route', difficulty: '4', creators: null },
            ],
        })
        const { load, latestRoutes } = useClimbingAnalytics()

        await load()

        expect(latestRoutes.value[0].creators).toEqual([])
        expect(latestRoutes.value[0].location).toBeNull()
        expect(latestRoutes.value[0].type).toBeNull()
    })

    it('refresh is an alias for load', async () => {
        fetchMock.mockResolvedValue(sampleResponse)
        const { refresh, hasData } = useClimbingAnalytics()

        await refresh()

        expect(hasData.value).toBe(true)
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })
})
