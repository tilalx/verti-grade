import { test, expect } from '@playwright/test'
import PocketBase from 'pocketbase'
import { authAsSuperuser } from '../../support/seed'
import { mailbox, waitForMail } from '../../support/mail'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'

test('an anonymous notice cannot relay its own text to any mailbox', async ({
    request,
}, info) => {
    const prefix = `relay-w${info.workerIndex}-${Date.now()}`
    const recipient = mailbox(prefix, 'victim')
    const spamName = `${prefix}-WIN-A-PRIZE`
    const spamText = `${prefix}-cheap-pills-at-spam.example`

    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const [route] = (
        await root.collection('routes').getList(1, 1, { requestKey: null })
    ).items

    const created = await request.post('/api/collections/reports/records', {
        data: {
            content_type: 'route',
            content_id: route!.id,
            content_url: 'https://spam.example/offer',
            reason: 'spam_fraud',
            explanation: spamText,
            notifier_name: spamName,
            notifier_email: recipient,
            good_faith: true,
        },
    })
    expect(created.ok()).toBe(true)
    const { id } = await created.json()

    const receipt = await waitForMail(request, recipient, {
        subject: /received/i,
    })
    expect(receipt.HTML).toContain(id)
    for (const injected of [spamName, spamText, 'spam.example']) {
        expect(receipt.HTML).not.toContain(injected)
    }

    await root.collection('reports').delete(id, { requestKey: null })
})
