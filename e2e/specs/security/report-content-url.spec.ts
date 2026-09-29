import { test, expect } from '../../support/fixtures'

for (const contentUrl of [
    'javascript:alert(document.domain)',
    'https://phishing.example/login',
]) {
    test(`a report cannot choose its own content link: ${contentUrl}`, async ({
        request,
        root,
        route,
        testPrefix,
    }) => {
        const created = await request.post('/api/collections/reports/records', {
            data: {
                content_type: 'route',
                content_id: route.id,
                content_url: contentUrl,
                reason: 'other',
                explanation: `${testPrefix} content url check`,
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
        expect(stored.content_url).toBe(`/route?id=${route.id}`)
    })
}
