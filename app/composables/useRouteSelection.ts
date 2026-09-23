import type { Ref } from 'vue'

export function useRouteSelection(
    pbFilter: Readonly<Ref<string>>,
    totalItems: Readonly<Ref<number>>,
) {
    const pb = usePocketbase()

    const selectedRouteIds = ref(new Set<string>())
    let cachedIds: { filter: string; ids: string[] } | null = null

    const selectedCount = computed(() => selectedRouteIds.value.size)
    const hasSelection = computed(() => selectedCount.value > 0)
    const areAllSelected = computed(
        () => totalItems.value > 0 && selectedCount.value >= totalItems.value,
    )

    const invalidate = () => {
        cachedIds = null
    }

    const loadAllRouteIds = async () => {
        const filter = pbFilter.value
        if (cachedIds?.filter === filter && cachedIds.ids.length) {
            return cachedIds.ids
        }
        invalidate()
        const records = await pb
            .collection('routes')
            .getFullList<{ id: string }>({
                batch: 200,
                fields: 'id',
                filter: filter || undefined,
            })
        const ids = records.map((route) => route.id).filter(Boolean)
        cachedIds = { filter, ids }
        return ids
    }

    const update = (id: string, isSelected: boolean) => {
        const next = new Set(selectedRouteIds.value)
        if (isSelected) next.add(id)
        else next.delete(id)
        selectedRouteIds.value = next
    }

    const clear = () => {
        selectedRouteIds.value = new Set()
    }

    const remove = (ids: string[]) => {
        if (!ids.length) return
        const next = new Set(selectedRouteIds.value)
        ids.forEach((id) => next.delete(id))
        selectedRouteIds.value = next
    }

    const toggleAll = async () => {
        if (areAllSelected.value) {
            clear()
            return
        }
        selectedRouteIds.value = new Set(await loadAllRouteIds())
    }

    return {
        selectedRouteIds,
        selectedCount,
        hasSelection,
        areAllSelected,
        update,
        clear,
        remove,
        toggleAll,
        invalidate,
    }
}
