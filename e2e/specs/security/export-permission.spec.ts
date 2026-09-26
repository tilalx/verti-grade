import { test, expect } from '@playwright/test'
import PocketBase from 'pocketbase'
import { authAsSuperuser, ensureUser, getRoleIds } from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'

test('a climber without manage_routes cannot generate exports', async ({
    request,
}, info) => {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const roleIds = await getRoleIds(root)
    const climber = await ensureUser(
        root,
        roleIds.user,
        'user',
        `export-guard-w${info.workerIndex}`,
    )

    const client = new PocketBase(PB_URL)
    await client
        .collection('users')
        .authWithPassword(climber.email, climber.password)

    for (const format of ['pdf', 'xlsx', 'json']) {
        const response = await request.post(`/api/ui/${format}`, {
            headers: { Authorization: client.authStore.token },
            data: { ids: ['any-route'] },
        })
        expect(response.status(), format).toBe(403)
    }
})
