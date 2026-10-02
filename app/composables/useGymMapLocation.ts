import type { WallRecord } from '~/types/models'
import { sanitizeGymMap } from '#shared/utils/mapGeometry'
import { toMapWalls } from '~/utils/gymMap'

interface GymMapLocationOptions {
    includeUnmapped?: boolean
    confirmLeave?: () => Promise<boolean>
}

export function useGymMapLocation(
    key: string,
    { includeUnmapped = false, confirmLeave }: GymMapLocationOptions = {},
) {
    const pb = usePocketbase()
    const route = useRoute()
    const router = useRouter()
    const locationsRequest = useLocations()
    const locations = locationsRequest.data

    const selectableLocations = computed(() =>
        includeUnmapped
            ? locations.value
            : locations.value.filter((record) => sanitizeGymMap(record.map)),
    )
    const locationItems = computed(() =>
        selectableLocations.value.map((record) => ({
            title: record.name,
            value: record.id,
        })),
    )
    const locationId = computed({
        get: () =>
            locations.value.some((record) => record.id === route.query.location)
                ? (route.query.location as string)
                : (selectableLocations.value[0]?.id ?? ''),
        set: async (id: string) => {
            if (id === locationId.value) return
            if (confirmLeave && !(await confirmLeave())) return
            void router.replace({ query: { location: id } })
        },
    })
    const location = computed(() =>
        locations.value.find((record) => record.id === locationId.value),
    )
    const map = computed(() => sanitizeGymMap(location.value?.map))

    const wallsRequest = useAsyncData(
        `${key}-walls`,
        async () => {
            await locationsRequest
            return locationId.value
                ? pb.collection('walls').getFullList<WallRecord>({
                      filter: pb.filter('location = {:id}', {
                          id: locationId.value,
                      }),
                      sort: 'sort,name',
                      requestKey: `${key}Walls`,
                  })
                : []
        },
        { watch: [locationId], default: () => [] },
    )
    const walls = wallsRequest.data
    const mapWalls = computed(() =>
        map.value ? toMapWalls(walls.value, map.value) : [],
    )

    const state = {
        locations,
        refreshLocations: locationsRequest.refresh,
        locationItems,
        locationId,
        location,
        map,
        walls,
        wallsError: wallsRequest.error,
        refreshWalls: wallsRequest.refresh,
        mapWalls,
    }
    return Promise.all([locationsRequest, wallsRequest]).then(() => state)
}
