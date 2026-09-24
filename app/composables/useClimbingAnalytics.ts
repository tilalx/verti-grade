import type { AnalyticsQuery, AnalyticsResponse } from '#shared/utils/analytics'

const QUERY_KEYS = [
    'range',
    'from',
    'to',
    'location',
    'type',
    'archived',
] as const
const LIVE_DEBOUNCE_MS = 2000

export function useClimbingAnalytics() {
    const route = useRoute()
    const router = useRouter()
    const pb = usePocketbase()
    const requestFetch = useRequestFetch()

    const query = computed<AnalyticsQuery>(() =>
        Object.fromEntries(
            QUERY_KEYS.flatMap((key) => {
                const value = route.query[key]
                return typeof value === 'string' && value ? [[key, value]] : []
            }),
        ),
    )

    function updateQuery(patch: Partial<AnalyticsQuery>) {
        const next = { ...route.query, ...patch }
        void router.replace({
            query: Object.fromEntries(
                Object.entries(next).filter(([, value]) => value),
            ),
        })
    }

    const { data, status, error, refresh } = useAsyncData(
        'climbing-analytics',
        () =>
            requestFetch<AnalyticsResponse>('/api/manage/analytics', {
                query: query.value,
                headers: pb.authStore.token
                    ? { Authorization: pb.authStore.token }
                    : undefined,
            }),
        { watch: [query] },
    )

    const initialLoading = computed(
        () => status.value === 'pending' && !data.value,
    )

    const { subscribe } = usePbSubscription()
    let refreshTimer: ReturnType<typeof setTimeout> | undefined
    let staleWhileHidden = false

    function scheduleRefresh() {
        clearTimeout(refreshTimer)
        refreshTimer = setTimeout(() => {
            if (document.visibilityState === 'hidden') {
                staleWhileHidden = true
                return
            }
            void refresh()
        }, LIVE_DEBOUNCE_MS)
    }

    function refreshIfStale() {
        if (document.visibilityState !== 'visible' || !staleWhileHidden) return
        staleWhileHidden = false
        void refresh()
    }

    onMounted(async () => {
        document.addEventListener('visibilitychange', refreshIfStale)
        await Promise.all([
            subscribe('routes', scheduleRefresh),
            subscribe('ratings', scheduleRefresh),
        ]).catch(() => {})
    })

    onBeforeUnmount(() => {
        clearTimeout(refreshTimer)
        document.removeEventListener('visibilitychange', refreshIfStale)
    })

    return {
        query,
        updateQuery,
        analytics: data,
        initialLoading,
        error,
    }
}
