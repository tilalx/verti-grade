export function useRouteFilters() {
    const { t } = useI18n()

    const searchRouteName = ref('')
    const selectedDifficulty = ref('')
    const selectedType = ref('')
    const selectedLocation = ref('')

    const difficulties = computed(() => [
        { text: t('filter.all'), value: '' },
        ...Array.from({ length: 10 }, (_, i) => ({
            text: String(i + 1),
            value: String(i + 1),
        })),
    ])

    const types = computed(() => [
        { text: t('filter.all'), value: '' },
        { text: t('routes.types.route'), value: 'Route' },
        { text: t('routes.types.boulder'), value: 'Boulder' },
    ])

    const locations = computed(() => [
        { text: t('filter.all'), value: '' },
        { text: 'Hanau', value: 'Hanau' },
        { text: 'Gelnhausen', value: 'Gelnhausen' },
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
        if (searchRouteName.value.trim()) {
            const term = searchRouteName.value.trim().replace(/"/g, '\\"')
            parts.push(`name ~ "${term}"`)
        }
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
