import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

const pocketbaseInstances: Array<{ url: string; authStore: unknown }> = []
const PocketBaseMock = vi.fn(function (url: string, authStore: unknown) {
    const instance = {
        url,
        authStore: authStore ?? { loadFromCookie: vi.fn() },
    }
    pocketbaseInstances.push(instance)
    return instance
})

class BaseAuthStoreMock {
    loadFromCookie = vi.fn()
    exportToCookie = vi.fn(() => 'pb_auth=serialized')
    save() {}
    clear() {}
}

vi.mock('pocketbase', () => ({
    default: PocketBaseMock,
    BaseAuthStore: BaseAuthStoreMock,
}))

const originalNodeEnv = process.env.NODE_ENV

describe('usePocketbase', () => {
    beforeEach(() => {
        vi.resetModules()
        PocketBaseMock.mockClear()
        pocketbaseInstances.length = 0
        delete (globalThis as Record<string, unknown>)._pb
        process.server = false
        process.env.NODE_ENV = 'development'
        globalThis.useRequestHeaders = vi.fn(() => ({ cookie: 'pb_auth=x' }))
    })

    afterAll(() => {
        process.env.NODE_ENV = originalNodeEnv
    })

    it('creates a new PocketBase instance on the server in development', async () => {
        process.server = true
        const { usePocketbase } = await import('~/composables/pocketbase.js')

        const instance = usePocketbase()

        expect(PocketBaseMock).toHaveBeenCalledTimes(1)
        expect(PocketBaseMock).toHaveBeenCalledWith('http://localhost:8090')
        expect(instance.url).toBe('http://localhost:8090')
        expect((globalThis as Record<string, unknown>)._pb).toBeUndefined()
    })

    it('loads the auth cookie from the request on the server', async () => {
        process.server = true
        const { usePocketbase } = await import('~/composables/pocketbase.js')

        const instance = usePocketbase()

        expect(instance.authStore.loadFromCookie).toHaveBeenCalledWith(
            'pb_auth=x',
            'pb_auth',
        )
    })

    it('creates a new PocketBase instance on the server in production', async () => {
        process.server = true
        process.env.NODE_ENV = 'production'
        const { usePocketbase } = await import('~/composables/pocketbase.js')

        usePocketbase()

        expect(PocketBaseMock).toHaveBeenCalledWith('http://localhost:8080')
    })

    it('reuses the same client-side instance after the first call', async () => {
        const { usePocketbase } = await import('~/composables/pocketbase.js')

        const first = usePocketbase()
        const second = usePocketbase()

        expect(PocketBaseMock).toHaveBeenCalledTimes(1)
        expect(first).toBe(second)
        expect(first.url).toBe('http://localhost:8090')
    })

    it('backs the client store with the auth cookie, not localStorage', async () => {
        const { usePocketbase } = await import('~/composables/pocketbase.js')

        const store = usePocketbase().authStore as BaseAuthStoreMock

        expect(store).toBeInstanceOf(BaseAuthStoreMock)
        expect(store.loadFromCookie).toHaveBeenCalledWith(
            document.cookie,
            'pb_auth',
        )

        store.save('token', { id: 'u1' })
        expect(document.cookie).toContain('pb_auth=')
    })

    it('uses the public root url on the client in production builds', async () => {
        process.env.NODE_ENV = 'production'
        const { usePocketbase } = await import('~/composables/pocketbase.js')

        usePocketbase()

        expect(PocketBaseMock.mock.calls[0][0]).toBe('/')
    })
})
