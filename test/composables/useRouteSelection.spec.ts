import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
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
})
