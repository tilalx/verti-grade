import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useRouteSelection } from '~/composables/useRouteSelection'

const getFullList = vi.fn()

beforeEach(() => {
    getFullList.mockReset()
    globalThis.__POCKETBASE_CLIENT__ = {
        collection: () => ({ getFullList }),
    }
})

describe('useRouteSelection', () => {
    it('toggles single ids and removes a batch', () => {
        const selection = useRouteSelection(ref(''), ref(3))
        selection.update('a', true)
        selection.update('b', true)
        selection.update('a', false)
        expect([...selection.selectedRouteIds.value]).toEqual(['b'])

        selection.remove(['b'])
        expect(selection.hasSelection.value).toBe(false)
    })

    it('selects all ids and reuses the cache for the same filter', async () => {
        getFullList.mockResolvedValue([{ id: 'a' }, { id: 'b' }])
        const filter = ref('archived = false')
        const selection = useRouteSelection(filter, ref(2))

        await selection.toggleAll()
        expect(selection.areAllSelected.value).toBe(true)

        await selection.toggleAll()
        expect(selection.hasSelection.value).toBe(false)

        await selection.toggleAll()
        expect(getFullList).toHaveBeenCalledTimes(1)

        selection.clear()
        filter.value = 'archived = true'
        await selection.toggleAll()
        expect(getFullList).toHaveBeenCalledTimes(2)
        expect(getFullList).toHaveBeenLastCalledWith(
            expect.objectContaining({ filter: 'archived = true' }),
        )
    })

    it('refetches after invalidate', async () => {
        getFullList.mockResolvedValue([{ id: 'a' }])
        const selection = useRouteSelection(ref(''), ref(1))
        await selection.toggleAll()
        selection.clear()
        selection.invalidate()
        await selection.toggleAll()
        expect(getFullList).toHaveBeenCalledTimes(2)
    })

    it('clears the selection when the filter changes', async () => {
        getFullList.mockResolvedValue([{ id: 'a' }, { id: 'b' }])
        const filter = ref('archived = false')
        const totalItems = ref(2)
        const selection = useRouteSelection(filter, totalItems)
        await selection.toggleAll()
        expect(selection.areAllSelected.value).toBe(true)

        filter.value = 'archived = true'
        totalItems.value = 1
        await nextTick()
        expect(selection.hasSelection.value).toBe(false)
        expect(selection.areAllSelected.value).toBe(false)
    })

    it('drops a select-all result that resolves after the filter changed', async () => {
        let resolveIds: (ids: { id: string }[]) => void = () => {}
        getFullList.mockReturnValue(
            new Promise((resolve) => (resolveIds = resolve)),
        )
        const filter = ref('')
        const selection = useRouteSelection(filter, ref(2))
        const pending = selection.toggleAll()
        filter.value = 'archived = true'
        resolveIds([{ id: 'a' }, { id: 'b' }])
        await pending
        expect(selection.hasSelection.value).toBe(false)
    })
})
