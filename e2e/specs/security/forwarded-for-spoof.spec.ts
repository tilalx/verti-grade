import { createHash } from 'node:crypto'
import { test, expect } from '../../support/fixtures'

test('a client cannot pick its own IP through X-Forwarded-For', async ({
    request,
    root,
    testPrefix,
}) => {
    const identity = `${testPrefix}-spoof@gripello.test`
    const spoofedIp = '127.0.0.1'
    const maskedIdentity = `unknown:${createHash('sha256').update(identity).digest('hex').slice(0, 8)}`

    const login = await request.post(
        '/api/collections/users/auth-with-password',
        {
            headers: { 'X-Forwarded-For': spoofedIp },
            data: { identity, password: 'wrong-password-1' },
        },
    )
    expect(login.status()).toBe(400)

    const recordedIp = () =>
        root
            .collection('audit_logs')
            .getFirstListItem(
                root.filter(
                    'action = "login_failed" && actor_label = {:identity}',
                    { identity: maskedIdentity },
                ),
                { requestKey: null },
            )
            .then((row) => row.ip as string)
            .catch(() => null)

    await expect.poll(recordedIp).not.toBeNull()
    expect(await recordedIp()).not.toBe(spoofedIp)
})
