import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref as vueRef, computed as vueComputed } from 'vue'

// ── Nuxt auto-import stubs ──────────────────────────────────────────────────
const useStateMocks: Record<string, { value: unknown }> = {}

vi.stubGlobal('useState', (key: string, init?: () => unknown) => {
    if (!useStateMocks[key]) {
        useStateMocks[key] = vueRef(init ? init() : undefined)
    }
    return useStateMocks[key]
})

vi.stubGlobal('ref', vueRef)
vi.stubGlobal('computed', vueComputed)

let pbMock: any
vi.stubGlobal('usePocketbase', () => pbMock)

function record(id: string, read = false) {
    return { id, user: 'u1', type: 'report_filed', read, created: '' }
}

describe('useNotificationQueue', () => {
    beforeEach(() => {
        vi.resetModules()
        for (const key of Object.keys(useStateMocks)) delete useStateMocks[key]

        pbMock = {
            authStore: { isValid: true },
            collection: vi.fn(),
            createBatch: vi.fn(),
        }
    })

    async function loadComposable() {
        const mod = await import('~/composables/useNotificationQueue')
        return mod.useNotificationQueue()
    }

    it('counts only unread items', async () => {
        pbMock.collection = vi.fn().mockReturnValue({
            getFullList: vi
                .fn()
                .mockResolvedValue([
                    record('a'),
                    record('b', true),
                    record('c'),
                ]),
        })

        const { refresh, items, unreadCount } = await loadComposable()
        await refresh()

        expect(items.value).toHaveLength(3)
        expect(unreadCount.value).toBe(2)
    })

    it('marks one item read and drops the count', async () => {
        const update = vi.fn().mockResolvedValue({})
        pbMock.collection = vi.fn().mockReturnValue({
            getFullList: vi.fn().mockResolvedValue([record('a'), record('b')]),
            update,
        })

        const { refresh, markRead, unreadCount } = await loadComposable()
        await refresh()
        await markRead('a')

        expect(update).toHaveBeenCalledWith('a', { read: true })
        expect(unreadCount.value).toBe(1)
    })

    it('restores the item when marking read fails', async () => {
        pbMock.collection = vi.fn().mockReturnValue({
            getFullList: vi.fn().mockResolvedValue([record('a')]),
            update: vi.fn().mockRejectedValue(new Error('offline')),
        })

        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {})
        const { refresh, markRead, unreadCount } = await loadComposable()
        await refresh()
        await markRead('a')

        expect(unreadCount.value).toBe(1)
        consoleError.mockRestore()
    })

    it('removes a dismissed item', async () => {
        const del = vi.fn().mockResolvedValue(true)
        pbMock.collection = vi.fn().mockReturnValue({
            getFullList: vi.fn().mockResolvedValue([record('a'), record('b')]),
            delete: del,
        })

        const { refresh, dismiss, items } = await loadComposable()
        await refresh()
        await dismiss('a')

        expect(del).toHaveBeenCalledWith('a')
        expect(items.value.map((i: any) => i.id)).toEqual(['b'])
    })

    it('puts a dismissed item back when the delete fails', async () => {
        pbMock.collection = vi.fn().mockReturnValue({
            getFullList: vi.fn().mockResolvedValue([record('a'), record('b')]),
            delete: vi.fn().mockRejectedValue(new Error('offline')),
        })

        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {})
        const { refresh, dismiss, items } = await loadComposable()
        await refresh()
        await dismiss('a')

        expect(items.value.map((i: any) => i.id)).toEqual(['a', 'b'])
        consoleError.mockRestore()
    })

    it('clears every unread flag in one batch', async () => {
        const batchUpdate = vi.fn()
        const send = vi.fn().mockResolvedValue([])
        pbMock.createBatch = vi.fn().mockReturnValue({
            collection: () => ({ update: batchUpdate }),
            send,
        })
        pbMock.collection = vi.fn().mockReturnValue({
            getFullList: vi
                .fn()
                .mockResolvedValue([
                    record('a'),
                    record('b'),
                    record('c', true),
                ]),
        })

        const { refresh, markAllRead, unreadCount } = await loadComposable()
        await refresh()
        await markAllRead()

        expect(send).toHaveBeenCalledTimes(1)
        expect(batchUpdate).toHaveBeenCalledTimes(2)
        expect(unreadCount.value).toBe(0)
    })

    it('keeps the list when a refresh is auto-cancelled', async () => {
        pbMock.collection = vi.fn().mockReturnValue({
            getFullList: vi
                .fn()
                .mockResolvedValueOnce([record('a')])
                .mockRejectedValueOnce(
                    Object.assign(new Error('autocancelled'), {
                        isAbort: true,
                        status: 0,
                    }),
                ),
        })

        const { refresh, items } = await loadComposable()
        await refresh()
        await refresh()

        expect(items.value).toHaveLength(1)
    })

    it('empties the queue when signed out', async () => {
        pbMock.authStore.isValid = false
        pbMock.collection = vi.fn()

        const { refresh, items } = await loadComposable()
        await refresh()

        expect(items.value).toEqual([])
        expect(pbMock.collection).not.toHaveBeenCalled()
    })
})
