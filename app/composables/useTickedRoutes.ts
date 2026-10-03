import type { TickRecord } from '~/types/models'
import { isOfflineError, opsOfUser } from '~/utils/tickOutbox'

export function useTickedRoutes() {
    const pb = usePocketbase()
    const outbox = useTickOutbox()
    const { data } = useAsyncData(
        'ticked-routes',
        async () => {
            if (!pb.authStore.isValid) return []
            const sends = await pb
                .collection('tick_sends')
                .getFullList<Pick<TickRecord, 'route'>>({
                    fields: 'route',
                    requestKey: null,
                })
                .catch(async (error) =>
                    isOfflineError(error)
                        ? (await outbox.cachedTicks()).filter(
                              (tick) => tick.type !== 'attempt',
                          )
                        : [],
                )
            return sends.map((send) => send.route ?? '')
        },
        { default: () => [] },
    )

    return {
        tickedRouteIds: computed(
            () =>
                new Set([
                    ...data.value,
                    ...opsOfUser(
                        outbox.queue.value,
                        pb.authStore.record?.id,
                    ).flatMap((op) =>
                        op.op === 'create' &&
                        !op.failed &&
                        op.record?.route &&
                        op.record.type !== 'attempt'
                            ? [op.record.route]
                            : [],
                    ),
                ]),
        ),
        refreshTickedRoutes: () =>
            refreshNuxtData(['ticked-routes', 'logbook']),
    }
}
