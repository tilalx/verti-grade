import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref as vueRef } from 'vue'

// ── Nuxt auto-import stubs ──────────────────────────────────────────────────
const useStateMocks: Record<string, { value: unknown }> = {}

vi.stubGlobal('useState', (key: string, init?: () => unknown) => {
    if (!useStateMocks[key]) {
        useStateMocks[key] = vueRef(init ? init() : undefined)
    }
    return useStateMocks[key]
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
        }
    })

    async function loadComposable() {
        const mod = await import('~/composables/usePermissions')
        return mod.usePermissions()
    }

    // ── can() before loading ─────────────────────────────────────────────

    it('returns true for any feature before permissions are loaded', async () => {
        const { can } = await loadComposable()

        expect(can('manage_routes')).toBe(true)
        expect(can('anything')).toBe(true)
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

    it('admin role always has all permissions', async () => {
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
        expect(can('manage_users')).toBe(true)
        expect(can('manage_settings')).toBe(true)
        expect(can('some_future_feature')).toBe(true)
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
