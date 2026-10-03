import type { OpenRouteDefectRecord } from '~/types/models'
import { cacheKeys } from '~/utils/realtimeCache'
import { defectSeverityByRoute } from '~/utils/tasks'

export function useOpenDefects() {
    const pb = usePocketbase()
    const { data, refresh } = useAsyncData(
        cacheKeys.openDefects,
        () =>
            pb
                .collection('open_route_defects')
                .getFullList<OpenRouteDefectRecord>({
                    fields: 'route,category',
                    requestKey: null,
                })
                .catch(() => []),
        { default: () => [] },
    )

    return {
        defectsByRoute: computed(() => defectSeverityByRoute(data.value)),
        refreshOpenDefects: refresh,
    }
}
