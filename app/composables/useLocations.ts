import type { LocationRecord } from '~/types/models'

export function useLocations() {
    const pb = usePocketbase()

    return useAsyncData<LocationRecord[]>(
        'locations',
        () =>
            pb.collection('locations').getFullList<LocationRecord>({
                sort: 'name',
                requestKey: 'locationsList',
            }),
        { default: () => [] },
    )
}
