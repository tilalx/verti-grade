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

test.describe('user manager without admin role', () => {
    let root: PocketBase

    test.beforeAll(async () => {
        root = await superuser()
    })

    async function permissionIds(names: string[]) {
        const records = await root
            .collection('permissions')
            .getFullList({ requestKey: null })
        return records
            .filter((record) => names.includes(record.name))
            .map((record) => record.id)
    }

    async function managerSetup(prefix: string) {
        const managerRole = await root.collection('roles').create({
            name: `${prefix}-mgr-role`,
            permissions: await permissionIds(['manage_users']),
        })
        const narrowRole = await root.collection('roles').create({
            name: `${prefix}-narrow-role`,
            permissions: [],
        })
        const manager = await ensureUser(
            root,
            managerRole.id,
            'user',
            `${prefix}-mgr`,
        )
        const target = await ensureUser(
            root,
            narrowRole.id,
            'user',
            `${prefix}-tgt`,
        )
        const pb = new PocketBase(PB_URL)
        await pb
            .collection('users')
            .authWithPassword(manager.email, manager.password)
        return { pb, managerRole, narrowRole, manager, target }
    }

    async function teardown(setup: Awaited<ReturnType<typeof managerSetup>>) {
        for (const id of [setup.manager.id, setup.target.id]) {
            await root
                .collection('users')
                .delete(id, { requestKey: null })
                .catch(() => {})
        }
        for (const id of [setup.managerRole.id, setup.narrowRole.id]) {
            await root
                .collection('roles')
                .delete(id, { requestKey: null })
                .catch(() => {})
        }
    }

    test('cannot give the admin role to anyone', async ({}, info) => {
        const setup = await managerSetup(
            `guard-noadm-w${info.workerIndex}-${Date.now()}`,
        )
        try {
            const adminRole = (await getRoleIds(root)).admin

            await expect(
                setup.pb
                    .collection('users')
                    .update(setup.manager.id, { role: adminRole }),
            ).rejects.toMatchObject({ status: 403 })
            await expect(
                setup.pb
                    .collection('users')
                    .update(setup.target.id, { role: adminRole }),
            ).rejects.toMatchObject({ status: 403 })
            await expect(
                setup.pb.collection('users').create({
                    email: `${setup.managerRole.name}-new@gripello.test`,
                    password: 'E2ePassw0rd!',
                    passwordConfirm: 'E2ePassw0rd!',
                    role: adminRole,
                }),
            ).rejects.toMatchObject({ status: 403 })

            const target = await root
                .collection('users')
                .getOne(setup.target.id)
            expect(target.role).toBe(setup.narrowRole.id)
        } finally {
            await teardown(setup)
        }
    })

    test('cannot add a permission it does not hold to its own role', async ({}, info) => {
        const setup = await managerSetup(
            `guard-perm-w${info.workerIndex}-${Date.now()}`,
        )
        try {
            const [settingsPermission] = await permissionIds([
                'manage_settings',
            ])

            await expect(
                setup.pb.collection('roles').update(setup.managerRole.id, {
                    'permissions+': settingsPermission,
                }),
            ).rejects.toMatchObject({ status: 403 })

            const role = await root
                .collection('roles')
                .getOne(setup.managerRole.id)
            expect(role.permissions).not.toContain(settingsPermission)
        } finally {
            await teardown(setup)
        }
    })

    test('can assign a role within its own permissions', async ({}, info) => {
        const setup = await managerSetup(
            `guard-sub-w${info.workerIndex}-${Date.now()}`,
        )
        try {
            const moved = await setup.pb
                .collection('users')
                .update(setup.target.id, { role: setup.managerRole.id })

            expect(moved.role).toBe(setup.managerRole.id)
        } finally {
            await teardown(setup)
        }
    })
})
