import { test, expect } from '@playwright/test'
import PocketBase from 'pocketbase'
import { authAsSuperuser } from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'

test('a batch sub-request cannot pick its own IP through X-Real-IP', async ({
    request,
}, info) => {
    const spoofedIp = '127.0.0.1'

    const batch = await request.post('/api/batch', {
        data: {
            requests: [
                {
                    method: 'POST',
                    url: '/api/collections/reports/records',
                    headers: { 'X-Real-IP': spoofedIp },
                    body: {
                        content_type: 'route',
                        content_id: `bip${info.workerIndex}${Date.now()}`.slice(
                            0,
                            15,
                        ),
                        reason: 'other',
                        explanation: 'batch real ip',
                        notifier_name: 'E2E Reporter',
                        notifier_email: 'e2e-reporter@example.com',
                        good_faith: true,
                    },
                },
            ],
        },
    })
    expect(batch.status()).toBe(200)
    const [created] = await batch.json()
    const reportId = created.body.id as string

    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const recordedIp = () =>
        root
            .collection('audit_logs')
            .getFirstListItem(
                root.filter(
                    'action = "create" && collection_name = "reports" && record_id = {:reportId}',
                    { reportId },
                ),
                { requestKey: null },
            )
            .then((row) => row.ip as string)
            .catch(() => null)

    await expect.poll(recordedIp).not.toBeNull()
    expect(await recordedIp()).not.toBe(spoofedIp)

    await root.collection('reports').delete(reportId)
})
