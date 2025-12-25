import { computed, ref } from 'vue'
import { useRequestFetch } from 'nuxt/app'

interface DifficultyDatum {
    grade: string
    count: number
}

interface RouteSetterDatum {
    setter: string
    count: number
}

interface TimelineDatum {
    period: string
    count: number
}

interface LatestCommentDatum {
    id: string
    routeId: string | null
    routeName: string
    rating: number | null
    comment: string
    created: string | null
}

export interface LatestRouteDatum {
    id: string
    name: string
    difficulty: string
    location: string | null
    screwDate: string | null
    creators: string[]
    type: string | null
}

interface AnalyticsSummary {
    totalRoutes: number
    activeRoutes: number
    averageDifficulty: number
    totalComments: number
    generatedAt: string
}

export interface ClimbingAnalyticsResponse {
    summary: AnalyticsSummary
    difficultyDistribution: DifficultyDatum[]
    routeSetters: RouteSetterDatum[]
    routeTimeline: TimelineDatum[]
    commentTimeline: TimelineDatum[]
    latestComments: LatestCommentDatum[]
    latestRoutes: LatestRouteDatum[]
}

const defaultResult: ClimbingAnalyticsResponse = {
    summary: {
        totalRoutes: 0,
        activeRoutes: 0,
        averageDifficulty: 0,
        totalComments: 0,
        generatedAt: '',
    },
    difficultyDistribution: [],
    routeSetters: [],
    routeTimeline: [],
    commentTimeline: [],
    latestComments: [],
    latestRoutes: [],
}

export function useClimbingAnalytics() {
    const analytics = ref<ClimbingAnalyticsResponse | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    const normalized = computed(() => analytics.value ?? defaultResult)
    const hasData = computed(() => normalized.value.summary.totalRoutes > 0)

    const requestFetch = useRequestFetch()

    const load = async () => {
        loading.value = true
        error.value = null

        try {
            const response = await requestFetch<ClimbingAnalyticsResponse>(
                '/api/admin/analytics',
            )

            analytics.value = normalizeResponse(response)
        } catch (err: any) {
            const message =
                err?.data?.message || err?.message || 'Unable to load analytics data'
            error.value = message
            analytics.value = null
        } finally {
            loading.value = false
        }
    }

    const summary = computed(() => normalized.value.summary)
    const difficultyDistribution = computed(
        () => normalized.value.difficultyDistribution,
    )
    const routeSetters = computed(() => normalized.value.routeSetters)
    const routeTimeline = computed(() => normalized.value.routeTimeline)
    const commentTimeline = computed(() => normalized.value.commentTimeline)
    const latestComments = computed(() => normalized.value.latestComments)
    const latestRoutes = computed(() => normalized.value.latestRoutes)

    return {
        analytics: normalized,
        summary,
        difficultyDistribution,
        routeSetters,
        routeTimeline,
        commentTimeline,
        latestComments,
        latestRoutes,
        hasData,
        loading,
        error,
        load,
        refresh: load,
    }
}

function normalizeResponse(
    response: ClimbingAnalyticsResponse,
): ClimbingAnalyticsResponse {
    const dedupe = <T>(items: T[]) => items.filter(Boolean)
    const formatNumber = (value: number) => Number.isFinite(value) ? value : 0

    return {
        summary: {
            totalRoutes: formatNumber(response.summary.totalRoutes),
            activeRoutes: formatNumber(response.summary.activeRoutes),
            averageDifficulty: Number(
                formatNumber(response.summary.averageDifficulty).toFixed(2),
            ),
            totalComments: formatNumber(response.summary.totalComments),
            generatedAt: response.summary.generatedAt || new Date().toISOString(),
        },
        difficultyDistribution: dedupe(response.difficultyDistribution ?? []).map((item) => ({
            grade: item.grade,
            count: formatNumber(item.count),
        })),
        routeSetters: dedupe(response.routeSetters ?? []).map((item) => ({
            setter: item.setter,
            count: formatNumber(item.count),
        })),
        routeTimeline: dedupe(response.routeTimeline ?? []).map((item) => ({
            period: item.period,
            count: formatNumber(item.count),
        })),
        commentTimeline: dedupe(response.commentTimeline ?? []).map((item) => ({
            period: item.period,
            count: formatNumber(item.count),
        })),
        latestComments: dedupe(response.latestComments ?? []).map((item) => ({
            id: item.id,
            routeId: item.routeId,
            routeName: item.routeName,
            rating: item.rating,
            comment: item.comment,
            created: item.created,
        })),
        latestRoutes: dedupe(response.latestRoutes ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            difficulty: item.difficulty,
            location: item.location ?? null,
            screwDate: item.screwDate ?? null,
            creators: Array.isArray(item.creators) ? item.creators : [],
            type: item.type ?? null,
        })),
    }
}
