import { test, expect } from '@playwright/test'
import PocketBase from 'pocketbase'
import { authAsSuperuser } from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'

for (const contentUrl of [
    'javascript:alert(document.domain)',
    'https://phishing.example/login',
]) {
    test(`a report cannot choose its own content link: ${contentUrl}`, async ({
        request,
    }) => {
        const root = new PocketBase(PB_URL)
        await authAsSuperuser(root)
        const [route] = (
            await root.collection('routes').getList(1, 1, { requestKey: null })
        ).items

        const created = await request.post('/api/collections/reports/records', {
            data: {
                content_type: 'route',
                content_id: route!.id,
                content_url: contentUrl,
                reason: 'other',
                explanation: 'e2e content url check',
                notifier_name: 'E2E Reporter',
                notifier_email: 'e2e-reporter@example.com',
                good_faith: true,
            },
        })
        expect(created.ok()).toBe(true)
        const { id } = await created.json()

        const stored = await root
            .collection('reports')
            .getOne(id, { requestKey: null })
        expect(stored.content_url).toBe(`/route?id=${route!.id}`)

        await root.collection('reports').delete(id, { requestKey: null })
    })
}
