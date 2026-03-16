import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// `#imports` is aliased in vitest.config.ts → test/__stubs__/imports.ts,
// which delegates usePocketbase() to the global set up in test/setup.ts.

const navigateToMock = vi.fn()

vi.stubGlobal('defineNuxtRouteMiddleware', (handler: Function) => handler)
vi.stubGlobal('navigateTo', navigateToMock)

describe('auth middleware', () => {
    beforeEach(() => {
        vi.resetModules()
        navigateToMock.mockReset()
        process.client = true
    })

    afterEach(() => {
        process.client = false
    })

    it('redirects unauthenticated users to /auth/login on protected routes', async () => {
        globalThis.__POCKETBASE_CLIENT__ = { authStore: { isValid: false } }
        const { default: middleware } = await import('~/middleware/auth.js')

        await middleware({ path: '/admin/routes', meta: {} }, {})

        expect(navigateToMock).toHaveBeenCalledWith('/auth/login')
    })

    it('allows authenticated users through protected routes', async () => {
        globalThis.__POCKETBASE_CLIENT__ = { authStore: { isValid: true } }
        const { default: middleware } = await import('~/middleware/auth.js')

        await middleware({ path: '/admin/routes', meta: {}, name: 'AdminRoutes' }, {})

        expect(navigateToMock).not.toHaveBeenCalledWith('/auth/login')
    })

    it('allows unauthenticated access to the home page', async () => {
        globalThis.__POCKETBASE_CLIENT__ = { authStore: { isValid: false } }
        const { default: middleware } = await import('~/middleware/auth.js')

        await middleware({ path: '/', meta: {} }, {})

        expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('does not run on the server side', async () => {
        process.client = false
        globalThis.__POCKETBASE_CLIENT__ = { authStore: { isValid: false } }
        const { default: middleware } = await import('~/middleware/auth.js')

        await middleware({ path: '/admin/routes', meta: {} }, {})

        expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('redirects already-authenticated users away from the login page', async () => {
        globalThis.__POCKETBASE_CLIENT__ = { authStore: { isValid: true } }
        const { default: middleware } = await import('~/middleware/auth.js')

        await middleware({ path: '/auth/login', meta: {}, name: 'Login' }, {})

        expect(navigateToMock).toHaveBeenCalledWith('/admin/routes')
    })
})
