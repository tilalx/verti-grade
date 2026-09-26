import type { TickRecord } from '~/types/models'

export function useTickedRoutes() {
    const pb = usePocketbase()
    const { data, refresh } = useAsyncData(
        'ticked-routes',
        async () => {
            if (!pb.authStore.isValid) return []
            const ticks = await pb
                .collection('ticks')
                .getFullList<Pick<TickRecord, 'route'>>({
                    fields: 'route',
                    filter: 'type != "attempt"',
                    requestKey: null,
                })
                .catch(() => [])
            return [...new Set(ticks.map((tick) => tick.route ?? ''))]
        },
        { default: () => [] },
    )

    return {
        tickedRouteIds: computed(() => new Set(data.value)),
        refreshTickedRoutes: refresh,
    }
}
