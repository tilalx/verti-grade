export function useRouteFilters() {
    const { t } = useI18n()
    const pb = usePocketbase()
    const { tenantId } = useTenant()

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

    // Dynamic locations fetched from the locations collection per tenant
    const locationItems = ref<{ text: string; value: string }[]>([])

    async function loadLocations() {
        const tid = tenantId.value
        if (!tid) {
            locationItems.value = []
            return
        }
        try {
            const records = await pb
                .collection('locations')
                .getFullList({ filter: `tenant_id = "${tid}"`, sort: 'order,name' })
            locationItems.value = records.map((r) => ({
                text: r.name as string,
                value: r.name as string,
            }))
        } catch {
            locationItems.value = []
        }
    }

    const locations = computed(() => [
        { text: t('filter.all'), value: '' },
        ...locationItems.value,
    ])

    // Load locations when tenant changes
    watch(tenantId, (tid) => {
        if (tid) loadLocations()
    }, { immediate: true })

    const activeFilterCount = computed(
        () =>
            [selectedDifficulty.value, selectedType.value, selectedLocation.value].filter(
                Boolean,
            ).length,
    )

    const pbFilter = computed(() => {
        const parts: string[] = []
        if (selectedDifficulty.value)
            parts.push(`difficulty = ${Number(selectedDifficulty.value)}`)
        if (selectedLocation.value) {
            const loc = selectedLocation.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
            parts.push(`location = "${loc}"`)
        }
        if (selectedType.value) {
            const type = selectedType.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
            parts.push(`type = "${type}"`)
        }
        if (searchRouteName.value.trim()) {
            const term = searchRouteName.value.trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"')
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
        loadLocations,
    }
}
