import { describe, expect, it, vi } from 'vitest'

let authRefresh: () => Promise<unknown>

vi.mock('pocketbase', () => ({
    default: vi.fn(function () {
        return {
            authStore: { save: vi.fn(), isValid: true },
            collection: () => ({ authRefresh: () => authRefresh() }),
        }
    }),
}))
vi.mock('h3', () => ({
    createError: (input: unknown) => input,
    getHeader: () => 'Bearer token',
}))

const { requirePermission } = await import('../../server/utils/pb-server')

function userWithRole(name: string, permissions: string[] = []) {
    return {
        record: {
            expand: {
                role: {
                    name,
                    expand: {
                        permissions: permissions.map((entry) => ({
                            name: entry,
                        })),
                    },
                },
            },
        },
    }
}

describe('requirePermission', () => {
    it('allows a role that has the permission', async () => {
        authRefresh = async () =>
            userWithRole('routesetter', ['view_analytics'])
        await expect(
            requirePermission({} as never, 'view_analytics'),
        ).resolves.toBeDefined()
    })

    it('allows admins without explicit permission', async () => {
        authRefresh = async () => userWithRole('admin')
        await expect(
            requirePermission({} as never, 'view_analytics'),
        ).resolves.toBeDefined()
    })

    it('rejects a role without the permission with 403', async () => {
        authRefresh = async () => userWithRole('user', ['manage_routes'])
        await expect(
            requirePermission({} as never, 'view_analytics'),
        ).rejects.toMatchObject({
            statusCode: 403,
        })
    })

    it('rejects a token PocketBase does not accept with 401', async () => {
        authRefresh = async () => {
            throw new Error('invalid')
        }
        const caught = await requirePermission(
            {} as never,
            'view_analytics',
        ).catch((e) => e)
        expect(caught).toMatchObject({ statusCode: 401 })
    })
})
