import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive, ref as vueRef, toRef } from 'vue'

// ── Nuxt auto-import stubs ──────────────────────────────────────────────────
const useStateMocks: Record<string, unknown> = reactive({})

vi.stubGlobal('useState', (key: string, init?: () => unknown) => {
    if (!(key in useStateMocks)) {
        useStateMocks[key] = init ? init() : undefined
    }
    return toRef(useStateMocks, key)
})

vi.stubGlobal('ref', vueRef)

vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))

const notifyErrorMock = vi.fn()
vi.stubGlobal('useNotification', () => ({ error: notifyErrorMock }))

let pbMock: any

vi.stubGlobal('usePocketbase', () => pbMock)

describe('usePermissions', () => {
    beforeEach(() => {
        vi.resetModules()
        for (const key of Object.keys(useStateMocks)) {
            delete useStateMocks[key]
        }
        pbMock = {
            authStore: {
                isValid: true,
                record: { role: 'role123' },
            },
            collection: vi.fn(),
            cancelRequest: vi.fn(),
        }
    })

    async function loadComposable() {
        const mod = await import('~/composables/usePermissions')
        return mod.usePermissions()
    }

    // ── can() before loading ─────────────────────────────────────────────

    it('denies every feature before permissions are loaded', async () => {
        const { can } = await loadComposable()

        expect(can('manage_routes')).toBe(false)
        expect(can('anything')).toBe(false)
    })

    // ── refreshPermissions ───────────────────────────────────────────────

    it('fetches role with expanded permissions and populates can()', async () => {
        pbMock.collection = vi.fn().mockReturnValue({
            getOne: vi.fn().mockResolvedValue({
                name: 'routesetter',
                expand: {
                    permissions: [
                        { name: 'manage_routes' },
                        { name: 'view_analytics' },
                        { name: 'manage_comments' },
                    ],
                },
            }),
        })

        const { can, refreshPermissions, roleName } = await loadComposable()
        await refreshPermissions()

        expect(pbMock.collection).toHaveBeenCalledWith('roles')
        expect(roleName.value).toBe('routesetter')
        expect(can('manage_routes')).toBe(true)
        expect(can('view_analytics')).toBe(true)
        expect(can('manage_comments')).toBe(true)
        expect(can('manage_users')).toBe(false)
        expect(can('manage_settings')).toBe(false)
    })

    it('grants the admin role only its assigned permissions', async () => {
        pbMock.collection = vi.fn().mockReturnValue({
            getOne: vi.fn().mockResolvedValue({
                name: 'admin',
                expand: {
                    permissions: [{ name: 'manage_routes' }],
                },
            }),
        })

        const { can, refreshPermissions } = await loadComposable()
        await refreshPermissions()

        expect(can('manage_routes')).toBe(true)
        expect(can('manage_users')).toBe(false)
    })

    it('user role with no permissions has no access', async () => {
        pbMock.collection = vi.fn().mockReturnValue({
            getOne: vi.fn().mockResolvedValue({
                name: 'user',
                expand: {
                    permissions: [],
                },
            }),
        })

        const { can, refreshPermissions } = await loadComposable()
        await refreshPermissions()

        expect(can('manage_routes')).toBe(false)
        expect(can('view_analytics')).toBe(false)
        expect(can('manage_users')).toBe(false)
        expect(can('manage_settings')).toBe(false)
        expect(can('manage_comments')).toBe(false)
        expect(can('run_inventory')).toBe(false)
    })

    // ── Unauthenticated / no role ────────────────────────────────────────

    it('clears permissions when user is not authenticated', async () => {
        pbMock.authStore.isValid = false
        pbMock.authStore.record = null

        const { can, refreshPermissions, loaded } = await loadComposable()
        await refreshPermissions()

        expect(loaded.value).toBe(true)
        expect(can('manage_routes')).toBe(false)
        expect(can('manage_users')).toBe(false)
    })

    it('clears permissions when user has no role assigned', async () => {
        pbMock.authStore.record = { role: null }

        const { can, refreshPermissions } = await loadComposable()
        await refreshPermissions()

        expect(can('manage_routes')).toBe(false)
        expect(can('manage_users')).toBe(false)
    })

    // ── Error handling ───────────────────────────────────────────────────

    it('clears permissions on fetch error', async () => {
        pbMock.collection = vi.fn().mockReturnValue({
            getOne: vi.fn().mockRejectedValue(new Error('Network error')),
        })

        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {})
        const { can, refreshPermissions, roleName } = await loadComposable()
        await refreshPermissions()

        expect(roleName.value).toBe('')
        expect(can('manage_routes')).toBe(false)
        consoleError.mockRestore()
    })

    it('keeps permissions and stays quiet when a refresh is auto-cancelled', async () => {
        const autoCancel = Object.assign(new Error('autocancelled'), {
            isAbort: true,
            status: 0,
        })
        pbMock.collection = vi.fn().mockReturnValue({
            getOne: vi
                .fn()
                .mockResolvedValueOnce({
                    name: 'routesetter',
                    expand: { permissions: [{ name: 'manage_routes' }] },
                })
                .mockRejectedValueOnce(autoCancel),
        })

        const { can, refreshPermissions, roleName } = await loadComposable()
        await refreshPermissions()
        notifyErrorMock.mockClear()

        await refreshPermissions()

        expect(notifyErrorMock).not.toHaveBeenCalled()
        expect(roleName.value).toBe('routesetter')
        expect(can('manage_routes')).toBe(true)
    })

    it('still reports a genuine fetch failure', async () => {
        pbMock.collection = vi.fn().mockReturnValue({
            getOne: vi
                .fn()
                .mockRejectedValue(
                    Object.assign(new Error('boom'), { status: 500 }),
                ),
        })

        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {})
        notifyErrorMock.mockClear()
        const { refreshPermissions } = await loadComposable()
        await refreshPermissions()

        expect(notifyErrorMock).toHaveBeenCalled()
        consoleError.mockRestore()
    })

    it('reports a failure without needing the Nuxt instance after the request', async () => {
        pbMock.collection = vi.fn().mockReturnValue({
            getOne: vi
                .fn()
                .mockRejectedValue(
                    Object.assign(new Error('gone'), { status: 404 }),
                ),
        })
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {})
        notifyErrorMock.mockClear()
        const { refreshPermissions } = await loadComposable()

        const nuxtApp = globalThis.useNuxtApp
        const outsideNuxt = () => {
            throw new Error('NUXT_E1001')
        }
        vi.stubGlobal('useNuxtApp', outsideNuxt)
        vi.stubGlobal('useNotification', outsideNuxt)
        try {
            await expect(refreshPermissions()).resolves.toBeUndefined()
            expect(notifyErrorMock).toHaveBeenCalled()
        } finally {
            vi.stubGlobal('useNuxtApp', nuxtApp)
            vi.stubGlobal('useNotification', () => ({ error: notifyErrorMock }))
            consoleError.mockRestore()
        }
    })

    it('handles role with no expanded permissions gracefully', async () => {
        pbMock.collection = vi.fn().mockReturnValue({
            getOne: vi.fn().mockResolvedValue({
                name: 'routesetter',
                expand: {},
            }),
        })

        const { can, refreshPermissions } = await loadComposable()
        await refreshPermissions()

        expect(can('manage_routes')).toBe(false)
    })

    // ── ensureLoaded ─────────────────────────────────────────────────────

    it('ensureLoaded fetches permissions only once', async () => {
        const getOneMock = vi.fn().mockResolvedValue({
            name: 'routesetter',
            expand: { permissions: [{ name: 'manage_routes' }] },
        })
        pbMock.collection = vi.fn().mockReturnValue({ getOne: getOneMock })

        const { ensureLoaded, can } = await loadComposable()

        await ensureLoaded()
        await ensureLoaded()
        await ensureLoaded()

        expect(getOneMock).toHaveBeenCalledTimes(1)
        expect(can('manage_routes')).toBe(true)
    })

    it('ensureLoaded reloads after a guest visit once the user signs in', async () => {
        const getOneMock = vi.fn().mockResolvedValue({
            name: 'routesetter',
            expand: { permissions: [{ name: 'manage_routes' }] },
        })
        pbMock.collection = vi.fn().mockReturnValue({ getOne: getOneMock })
        pbMock.authStore = { isValid: false, record: null }

        const { ensureLoaded, can } = await loadComposable()
        await ensureLoaded()
        expect(can('manage_routes')).toBe(false)

        pbMock.authStore = { isValid: true, record: { role: 'role123' } }
        await ensureLoaded()

        expect(getOneMock).toHaveBeenCalledTimes(1)
        expect(can('manage_routes')).toBe(true)
    })

    it('ensureLoaded clears permissions after logout', async () => {
        pbMock.collection = vi.fn().mockReturnValue({
            getOne: vi.fn().mockResolvedValue({
                name: 'routesetter',
                expand: { permissions: [{ name: 'manage_routes' }] },
            }),
        })

        const { ensureLoaded, can } = await loadComposable()
        await ensureLoaded()
        expect(can('manage_routes')).toBe(true)

        pbMock.authStore = { isValid: false, record: null }
        await ensureLoaded()

        expect(can('manage_routes')).toBe(false)
    })

    it('ensureLoaded reloads when the role changes', async () => {
        const getOneMock = vi
            .fn()
            .mockResolvedValueOnce({
                name: 'user',
                expand: { permissions: [] },
            })
            .mockResolvedValueOnce({
                name: 'routesetter',
                expand: { permissions: [{ name: 'manage_routes' }] },
            })
        pbMock.collection = vi.fn().mockReturnValue({ getOne: getOneMock })

        const { ensureLoaded, can } = await loadComposable()
        await ensureLoaded()
        pbMock.authStore.record = { role: 'role456' }
        await ensureLoaded()

        expect(getOneMock).toHaveBeenLastCalledWith(
            'role456',
            expect.anything(),
        )
        expect(can('manage_routes')).toBe(true)
    })

    it('drops an in-flight role fetch when the user signs out', async () => {
        let resolveRole: (value: unknown) => void = () => {}
        pbMock.collection = vi.fn().mockReturnValue({
            getOne: vi.fn(
                () => new Promise((resolve) => (resolveRole = resolve)),
            ),
        })

        const { ensureLoaded, refreshPermissions, can } = await loadComposable()
        const inFlight = ensureLoaded()

        pbMock.authStore = { isValid: false, record: null }
        await refreshPermissions()
        resolveRole({
            name: 'routesetter',
            expand: { permissions: [{ name: 'manage_routes' }] },
        })
        await inFlight

        expect(pbMock.cancelRequest).toHaveBeenCalledWith('userPermissions')
        expect(can('manage_routes')).toBe(false)
    })

    it('separate callers share one in-flight role fetch', async () => {
        let resolveRole: (value: unknown) => void = () => {}
        const getOneMock = vi.fn(
            () => new Promise((resolve) => (resolveRole = resolve)),
        )
        pbMock.collection = vi.fn().mockReturnValue({ getOne: getOneMock })

        const mod = await import('~/composables/usePermissions')
        const plugin = mod.usePermissions()
        const middleware = mod.usePermissions()
        const pluginLoad = plugin.ensureLoaded()
        const middlewareLoad = middleware.ensureLoaded()
        resolveRole({
            name: 'routesetter',
            expand: { permissions: [{ name: 'manage_routes' }] },
        })
        await Promise.all([pluginLoad, middlewareLoad])

        expect(getOneMock).toHaveBeenCalledTimes(1)
        expect(middleware.can('manage_routes')).toBe(true)
    })

    it('a superseded ensureLoaded waits for the winning request', async () => {
        const autoCancel = Object.assign(new Error('autocancelled'), {
            isAbort: true,
            status: 0,
        })
        let rejectFirst: (err: unknown) => void = () => {}
        let resolveSecond: (value: unknown) => void = () => {}
        pbMock.collection = vi.fn().mockReturnValue({
            getOne: vi
                .fn()
                .mockImplementationOnce(
                    () => new Promise((_, reject) => (rejectFirst = reject)),
                )
                .mockImplementationOnce(
                    () => new Promise((resolve) => (resolveSecond = resolve)),
                ),
        })

        const { ensureLoaded, refreshPermissions, can } = await loadComposable()
        let firstSettled = false
        const first = ensureLoaded().then(() => (firstSettled = true))

        pbMock.authStore.record = { role: 'role456' }
        const second = refreshPermissions()
        rejectFirst(autoCancel)
        await new Promise((resolve) => setTimeout(resolve, 0))
        expect(firstSettled).toBe(false)

        resolveSecond({
            name: 'routesetter',
            expand: { permissions: [{ name: 'manage_routes' }] },
        })
        await Promise.all([first, second])

        expect(can('manage_routes')).toBe(true)
    })

    // ── Permission refresh updates results ───────────────────────────────

    it('refreshPermissions updates can() results when role changes', async () => {
        const getOneMock = vi
            .fn()
            .mockResolvedValueOnce({
                name: 'routesetter',
                expand: {
                    permissions: [
                        { name: 'manage_routes' },
                        { name: 'view_analytics' },
                    ],
                },
            })
            .mockResolvedValueOnce({
                name: 'user',
                expand: {
                    permissions: [],
                },
            })
        pbMock.collection = vi.fn().mockReturnValue({ getOne: getOneMock })

        const { can, refreshPermissions, roleName } = await loadComposable()

        await refreshPermissions()
        expect(roleName.value).toBe('routesetter')
        expect(can('manage_routes')).toBe(true)
        expect(can('manage_users')).toBe(false)

        await refreshPermissions()
        expect(roleName.value).toBe('user')
        expect(can('manage_routes')).toBe(false)
        expect(can('view_analytics')).toBe(false)
    })

    // ── loaded state ─────────────────────────────────────────────────────

    it('sets loaded to true after successful refresh', async () => {
        pbMock.collection = vi.fn().mockReturnValue({
            getOne: vi.fn().mockResolvedValue({
                name: 'user',
                expand: { permissions: [] },
            }),
        })

        const { loaded, refreshPermissions } = await loadComposable()

        expect(loaded.value).toBe(false)
        await refreshPermissions()
        expect(loaded.value).toBe(true)
    })

    it('sets loaded to true even after error', async () => {
        pbMock.collection = vi.fn().mockReturnValue({
            getOne: vi.fn().mockRejectedValue(new Error('fail')),
        })

        vi.spyOn(console, 'error').mockImplementation(() => {})
        const { loaded, refreshPermissions } = await loadComposable()

        await refreshPermissions()
        expect(loaded.value).toBe(true)
    })
})
