import type { Ref } from 'vue'
import { cacheKeys, type KeyLocations } from '~/utils/realtimeCache'

export function useLiveLocation(keys: string[], locationId: Ref<string>) {
    const keyLocations = useState<KeyLocations>(
        cacheKeys.keyLocations,
        () => ({}),
    )
    watch(
        locationId,
        (id) => {
            for (const key of keys) keyLocations.value[key] = id
        },
        { immediate: true },
    )
}
