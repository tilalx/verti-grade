import type { TickRecord } from '~/types/models'

export function useTickedRoutes() {
    const pb = usePocketbase()
    const { data, refresh } = useAsyncData(
        'ticked-routes',
        async () => {
            if (!pb.authStore.isValid) return []
            const sends = await pb
                .collection('tick_sends')
                .getFullList<Pick<TickRecord, 'route'>>({
                    fields: 'route',
                    requestKey: null,
                })
                .catch(() => [])
            return sends.map((send) => send.route ?? '')
        },
        { default: () => [] },
    )

    return {
        tickedRouteIds: computed(() => new Set(data.value)),
        refreshTickedRoutes: refresh,
    }
}
