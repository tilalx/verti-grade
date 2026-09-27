import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { usePbList } from '~/composables/usePbList'

const notifyError = vi.fn()
vi.stubGlobal('useNotification', () => ({ error: notifyError }))

const getList = vi.fn()

function pageOf(ids: string[], totalItems: number) {
    return { items: ids.map((id) => ({ id })), totalItems }
}

beforeEach(() => {
    getList.mockReset()
    notifyError.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    globalThis.__POCKETBASE_CLIENT__ = { collection: () => ({ getList }) }
})

function createList(filter = 'a = 1') {
    const list = usePbList<{ id: string }>('things', {
        perPage: 2,
        requestKey: 'thingsList',
        query: () => ({ filter, sort: '-created' }),
    })
    return {
        ...list,
        ids: computed(() => list.items.value.map((item) => item.id)),
    }
}

describe('usePbList', () => {
    it('loads the first page with the query options', async () => {
        getList.mockResolvedValue(pageOf(['a', 'b'], 3))
        const list = createList()
        await list.refresh()
        expect(getList).toHaveBeenCalledWith(1, 2, {
            filter: 'a = 1',
            sort: '-created',
            requestKey: 'thingsList',
        })
        expect(list.ids.value).toEqual(['a', 'b'])
        expect(list.totalItems.value).toBe(3)
        expect(list.hasMore.value).toBe(true)
        expect(list.loading.value).toBe(false)
    })

    it('appends the next page and stops when exhausted', async () => {
        getList
            .mockResolvedValueOnce(pageOf(['a', 'b'], 3))
            .mockResolvedValueOnce(pageOf(['c'], 3))
        const list = createList()
        await list.refresh()
        await list.loadMore()
        expect(getList).toHaveBeenLastCalledWith(2, 2, expect.anything())
        expect(list.ids.value).toEqual(['a', 'b', 'c'])
        expect(list.hasMore.value).toBe(false)

        await list.loadMore()
        expect(getList).toHaveBeenCalledTimes(2)
    })

    it('skips rows already shown when a page overlaps after an insert', async () => {
        getList
            .mockResolvedValueOnce(pageOf(['b', 'c'], 4))
            .mockResolvedValueOnce(pageOf(['c', 'd'], 5))
        const list = createList()
        await list.refresh()
        list.items.value = [{ id: 'a' }, ...list.items.value]
        list.totalItems.value++
        await list.loadMore()
        expect(list.ids.value).toEqual(['a', 'b', 'c', 'd'])
    })

    it('refresh resets to the first page', async () => {
        getList
            .mockResolvedValueOnce(pageOf(['a', 'b'], 3))
            .mockResolvedValueOnce(pageOf(['c'], 3))
            .mockResolvedValueOnce(pageOf(['x'], 1))
        const list = createList()
        await list.refresh()
        await list.loadMore()
        await list.refresh()
        expect(getList).toHaveBeenLastCalledWith(1, 2, expect.anything())
        expect(list.ids.value).toEqual(['x'])
        expect(list.totalItems.value).toBe(1)
    })

    it('stores the error and notifies', async () => {
        const failure = new Error('down')
        getList.mockRejectedValue(failure)
        const list = createList()
        await list.refresh()
        expect(list.error.value).toBe(failure)
        expect(list.loading.value).toBe(false)
        expect(notifyError).toHaveBeenCalledWith('notifications.error.generic')
    })

    it('ignores aborted requests', async () => {
        getList.mockRejectedValue({ isAbort: true })
        const list = createList()
        await list.refresh()
        expect(list.error.value).toBeNull()
        expect(notifyError).not.toHaveBeenCalled()
    })
})
