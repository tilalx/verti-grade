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

// PocketBase mock
let pbMock: any

vi.stubGlobal('usePocketbase', () => pbMock)

describe('usePermissions', () => {
    beforeEach(() => {
        vi.resetModules()
        // Clear useState cache
        for (const key of Object.keys(useStateMocks)) {
            delete useStateMocks[key]
        }
        // Default PB mock: valid session with a role
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
                    permissions: [
                        { name: 'manage_routes' },
                    ],
                },
            }),
        })

        const { can, refreshPermissions } = await loadComposable()
        await refreshPermissions()

        // Admin can do everything, even features not explicitly in the expand
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

        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
        const { can, refreshPermissions, roleName } = await loadComposable()
        await refreshPermissions()

        expect(roleName.value).toBe('')
        expect(can('manage_routes')).toBe(false)
        consoleError.mockRestore()
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

        // getOne should only be called once despite multiple ensureLoaded calls
        expect(getOneMock).toHaveBeenCalledTimes(1)
        expect(can('manage_routes')).toBe(true)
    })

    // ── Permission refresh updates results ───────────────────────────────

    it('refreshPermissions updates can() results when role changes', async () => {
        // First: routesetter with manage_routes
        const getOneMock = vi.fn().mockResolvedValueOnce({
            name: 'routesetter',
            expand: {
                permissions: [
                    { name: 'manage_routes' },
                    { name: 'view_analytics' },
                ],
            },
        }).mockResolvedValueOnce({
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

        // Second: downgraded to user with no permissions
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
