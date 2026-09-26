import { DIFFICULTY_LEVELS, ROUTE_TYPES } from '~/utils/routes'
import { routeSearchFilter } from '~/utils/routeSearch'

export function useRouteFilters() {
    const { t } = useI18n()
    const { data: locationRecords } = useLocations()

    const searchRouteName = ref('')
    const selectedDifficulty = ref('')
    const selectedType = ref('')
    const selectedLocation = ref('')

    const difficulties = computed(() => [
        { text: t('filter.all'), value: '' },
        ...DIFFICULTY_LEVELS.map((level) => ({
            text: String(level),
            value: String(level),
        })),
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
            ].filter(Boolean).length,
    )

    const pbFilter = computed(() => {
        const parts: string[] = []
        if (selectedDifficulty.value)
            parts.push(`difficulty = ${Number(selectedDifficulty.value)}`)
        if (selectedLocation.value)
            parts.push(`location = "${selectedLocation.value}"`)
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
    }

    return {
        searchRouteName,
        selectedDifficulty,
        selectedType,
        selectedLocation,
        difficulties,
        types,
        locations,
        activeFilterCount,
        pbFilter,
        clearFilters,
    }
}
