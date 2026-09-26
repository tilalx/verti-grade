import { test, expect } from '@playwright/test'
import PocketBase from 'pocketbase'
import { authAsSuperuser } from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'

test('a client cannot pick its own IP through X-Forwarded-For', async ({
    request,
}, info) => {
    const identity = `spoof-w${info.workerIndex}-${Date.now()}@verti-grade.test`
    const spoofedIp = '127.0.0.1'

    const login = await request.post(
        '/api/collections/users/auth-with-password',
        {
            headers: { 'X-Forwarded-For': spoofedIp },
            data: { identity, password: 'wrong-password-1' },
        },
    )
    expect(login.status()).toBe(400)

    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const recordedIp = () =>
        root
            .collection('audit_logs')
            .getFirstListItem(
                root.filter(
                    'action = "login_failed" && actor_label = {:identity}',
                    { identity },
                ),
                { requestKey: null },
            )
            .then((row) => row.ip as string)
            .catch(() => null)

    await expect.poll(recordedIp).not.toBeNull()
    expect(await recordedIp()).not.toBe(spoofedIp)
})
