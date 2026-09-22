import { test, expect } from '@playwright/test'
import PocketBase from 'pocketbase'
import { authAsSuperuser, ensureUser, getRoleIds } from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'

async function superuser() {
    const pb = new PocketBase(PB_URL)
    await authAsSuperuser(pb)
    return pb
}

async function throwaway(
    admin: PocketBase,
    role: 'user' | 'admin',
    prefix: string,
) {
    const roleIds = await getRoleIds(admin)
    const seeded = await ensureUser(admin, roleIds[role], role, prefix)

    const pb = new PocketBase(PB_URL)
    await pb.collection('users').authWithPassword(seeded.email, seeded.password)

    return { pb, id: seeded.id, roleId: roleIds[role] }
}

test.describe('role escalation guard', () => {
    let root: PocketBase
    const cleanup: string[] = []

    test.beforeAll(async () => {
        root = await superuser()
    })

    test.afterAll(async () => {
        for (const id of cleanup) {
            await root
                .collection('users')
                .delete(id, { requestKey: null })
                .catch(() => {})
        }
    })

    test('a plain member cannot give themselves the admin role', async ({}, info) => {
        const { pb, id, roleId } = await throwaway(
            root,
            'user',
            `guard-esc-w${info.workerIndex}-${Date.now()}`,
        )
        cleanup.push(id)
        const adminRole = (await getRoleIds(root)).admin

        await expect(
            pb.collection('users').update(id, { role: adminRole }),
        ).rejects.toMatchObject({ status: 403 })

        const after = await root.collection('users').getOne(id)
        expect(after.role).toBe(roleId)
    })

    test('a plain member can still edit their own profile', async ({}, info) => {
        const { pb, id } = await throwaway(
            root,
            'user',
            `guard-self-w${info.workerIndex}-${Date.now()}`,
        )
        cleanup.push(id)

        const updated = await pb
            .collection('users')
            .update(id, { firstname: 'Guarded' })

        expect(updated.firstname).toBe('Guarded')
    })

    test('manage_users can still assign a role', async ({}, info) => {
        const stamp = `guard-grant-w${info.workerIndex}-${Date.now()}`
        const manager = await throwaway(root, 'admin', `${stamp}-mgr`)
        const target = await throwaway(root, 'user', `${stamp}-tgt`)
        cleanup.push(manager.id, target.id)

        const setterRole = (await getRoleIds(root)).routesetter
        expect(target.roleId).not.toBe(setterRole)

        const moved = await manager.pb
            .collection('users')
            .update(target.id, { role: setterRole })

        expect(moved.role).toBe(setterRole)
    })
})
