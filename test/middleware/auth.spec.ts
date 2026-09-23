import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const navigateToMock = vi.fn()

vi.stubGlobal('defineNuxtRouteMiddleware', (handler: Function) => handler)
vi.stubGlobal('navigateTo', navigateToMock)

// usePermissions mock
const canMock = vi.fn().mockReturnValue(true)
const ensureLoadedMock = vi.fn().mockResolvedValue(undefined)
vi.stubGlobal('usePermissions', () => ({
    can: canMock,
    ensureLoaded: ensureLoadedMock,
}))

describe('auth middleware', () => {
    beforeEach(() => {
        vi.resetModules()
        navigateToMock.mockReset()
        canMock.mockReset().mockReturnValue(true)
        ensureLoadedMock.mockReset().mockResolvedValue(undefined)
        process.client = true
    })

    afterEach(() => {
        process.client = false
    })

    // ── Basic auth ───────────────────────────────────────────────────────

    it('redirects unauthenticated users to /auth/login on protected routes', async () => {
        globalThis.__POCKETBASE_CLIENT__ = { authStore: { isValid: false } }
        const { default: middleware } = await import('~/middleware/auth')

        await middleware({ path: '/manage/routes', meta: {} }, {})

        expect(navigateToMock).toHaveBeenCalledWith('/auth/login')
    })

    it('allows authenticated users through protected routes', async () => {
        globalThis.__POCKETBASE_CLIENT__ = { authStore: { isValid: true } }
        const { default: middleware } = await import('~/middleware/auth')

        await middleware({ path: '/manage/routes', meta: {} }, {})

        expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('allows unauthenticated access to the home page', async () => {
        globalThis.__POCKETBASE_CLIENT__ = { authStore: { isValid: false } }
        const { default: middleware } = await import('~/middleware/auth')

        await middleware({ path: '/', meta: {} }, {})

        expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('guards on the server side too, so no content is flashed first', async () => {
        process.client = false
        globalThis.__POCKETBASE_CLIENT__ = { authStore: { isValid: false } }
        const { default: middleware } = await import('~/middleware/auth')

        await middleware({ path: '/manage/routes', meta: {} }, {})

        expect(navigateToMock).toHaveBeenCalledWith('/auth/login')
    })

    // ── auth: false pages (login, password reset) ────────────────────────

    it('allows unauthenticated access to pages with auth: false', async () => {
        globalThis.__POCKETBASE_CLIENT__ = { authStore: { isValid: false } }
        const { default: middleware } = await import('~/middleware/auth')

        await middleware({ path: '/auth/login', meta: { auth: false } }, {})

        expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('redirects authenticated users away from auth: false pages', async () => {
        globalThis.__POCKETBASE_CLIENT__ = { authStore: { isValid: true } }
        const { default: middleware } = await import('~/middleware/auth')

        await middleware({ path: '/auth/login', meta: { auth: false } }, {})

        expect(navigateToMock).toHaveBeenCalledWith('/manage/routes')
    })

    it('allows unauthenticated access to password reset with auth: false', async () => {
        globalThis.__POCKETBASE_CLIENT__ = { authStore: { isValid: false } }
        const { default: middleware } = await import('~/middleware/auth')

        await middleware(
            {
                path: '/auth/confirm-password-reset/abc123',
                meta: { auth: false },
            },
            {},
        )

        expect(navigateToMock).not.toHaveBeenCalled()
    })

    // ── Permission checks ────────────────────────────────────────────────

    it('allows access when user has the required permission', async () => {
        globalThis.__POCKETBASE_CLIENT__ = { authStore: { isValid: true } }
        canMock.mockReturnValue(true)
        const { default: middleware } = await import('~/middleware/auth')

        await middleware(
            {
                path: '/admin/users',
                meta: { requiredPermission: 'manage_users' },
            },
            {},
        )

        expect(ensureLoadedMock).toHaveBeenCalled()
        expect(canMock).toHaveBeenCalledWith('manage_users')
        expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('redirects to / when user lacks the required permission', async () => {
        globalThis.__POCKETBASE_CLIENT__ = { authStore: { isValid: true } }
        canMock.mockReturnValue(false)
        const { default: middleware } = await import('~/middleware/auth')

        await middleware(
            {
                path: '/admin/users',
                meta: { requiredPermission: 'manage_users' },
            },
            {},
        )

        expect(ensureLoadedMock).toHaveBeenCalled()
        expect(canMock).toHaveBeenCalledWith('manage_users')
        expect(navigateToMock).toHaveBeenCalledWith('/')
    })

    it('does not check permissions when none is required', async () => {
        globalThis.__POCKETBASE_CLIENT__ = { authStore: { isValid: true } }
        const { default: middleware } = await import('~/middleware/auth')

        await middleware({ path: '/manage/routes', meta: {} }, {})

        expect(canMock).not.toHaveBeenCalled()
        expect(ensureLoadedMock).not.toHaveBeenCalled()
    })

    it('awaits ensureLoaded before checking permission', async () => {
        globalThis.__POCKETBASE_CLIENT__ = { authStore: { isValid: true } }
        const callOrder: string[] = []
        ensureLoadedMock.mockImplementation(async () => {
            callOrder.push('ensureLoaded')
        })
        canMock.mockImplementation(() => {
            callOrder.push('can')
            return true
        })
        const { default: middleware } = await import('~/middleware/auth')

        await middleware(
            {
                path: '/admin/settings',
                meta: { requiredPermission: 'manage_settings' },
            },
            {},
        )

        expect(callOrder).toEqual(['ensureLoaded', 'can'])
    })

    it('checks each admin page permission correctly', async () => {
        globalThis.__POCKETBASE_CLIENT__ = { authStore: { isValid: true } }

        const pages = [
            { path: '/manage/routes', permission: 'manage_routes' },
            { path: '/manage/analytics', permission: 'view_analytics' },
            { path: '/manage/comments', permission: 'manage_comments' },
            { path: '/admin/users', permission: 'manage_users' },
            { path: '/admin/settings', permission: 'manage_settings' },
            { path: '/manage/inventory', permission: 'run_inventory' },
        ]

        for (const { path, permission } of pages) {
            canMock.mockReset().mockReturnValue(false)
            navigateToMock.mockReset()
            vi.resetModules()
            const { default: middleware } = await import('~/middleware/auth')

            await middleware(
                { path, meta: { requiredPermission: permission } },
                {},
            )

            expect(canMock).toHaveBeenCalledWith(permission)
            expect(navigateToMock).toHaveBeenCalledWith('/')
        }
    })
})
