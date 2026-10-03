import { cacheKeys } from '~/utils/realtimeCache'
import { ROUTE_TYPES } from '~/utils/routes'
import { routeSearchFilter } from '~/utils/routeSearch'
import type { WallRecord } from '~/types/models'

export function useRouteFilters() {
    const { t } = useI18n()
    const { data: locationRecords } = useLocations()
    const { gradeFilterItems, gradeFilterClause } = useGradeSystems()

    const searchRouteName = ref('')
    const selectedDifficulty = ref('')
    const selectedType = ref('')
    const selectedLocation = ref('')
    const selectedWall = ref('')
    const pb = usePocketbase()

    const { data: wallRecords } = useAsyncData(
        cacheKeys.routeFilterWalls,
        () =>
            selectedLocation.value
                ? pb.collection('walls').getFullList<WallRecord>({
                      filter: pb.filter('location = {:id}', {
                          id: selectedLocation.value,
                      }),
                      sort: 'sort,name',
                      fields: 'id,name',
                      requestKey: null,
                  })
                : Promise.resolve([]),
        { default: () => [], server: false, watch: [selectedLocation] },
    )
    useLiveLocation([cacheKeys.routeFilterWalls], selectedLocation)

    watch(selectedLocation, () => {
        selectedWall.value = ''
    })

    const walls = computed(() => [
        { text: t('filter.all'), value: '' },
        ...wallRecords.value.map((wall) => ({
            text: wall.name,
            value: wall.id,
        })),
    ])

    const difficulties = computed(() => [
        { text: t('filter.all'), value: '' },
        ...gradeFilterItems.value,
    ])

    const types = computed(() => [
        { text: t('filter.all'), value: '' },
        ...ROUTE_TYPES.map((value) => ({
            text: t(`routes.types.${value.toLowerCase()}`),
            value,
        })),
    ])

    const locations = computed(() => [
        { text: t('filter.all'), value: '' },
        ...locationRecords.value.map((location) => ({
            text: location.name,
            value: location.id,
        })),
    ])

    const activeFilterCount = computed(
        () =>
            [
                selectedDifficulty.value,
                selectedType.value,
                selectedLocation.value,
                selectedWall.value,
            ].filter(Boolean).length,
    )

    const pbFilter = computed(() => {
        const parts: string[] = []
        if (selectedDifficulty.value)
            parts.push(gradeFilterClause(selectedDifficulty.value))
        if (selectedLocation.value)
            parts.push(`location = "${selectedLocation.value}"`)
        if (selectedWall.value) parts.push(`wall = "${selectedWall.value}"`)
        if (selectedType.value) parts.push(`type = "${selectedType.value}"`)
        const search = routeSearchFilter(searchRouteName.value)
        if (search) parts.push(search)
        return parts.join(' && ')
    })

    function clearFilters() {
        searchRouteName.value = ''
        selectedDifficulty.value = ''
        selectedType.value = ''
        selectedLocation.value = ''
        selectedWall.value = ''
    }

    return {
        searchRouteName,
        selectedDifficulty,
        selectedType,
        selectedLocation,
        selectedWall,
        difficulties,
        types,
        locations,
        walls,
        activeFilterCount,
        pbFilter,
        clearFilters,
    }
}
