import { test, expect } from '../../support/fixtures'

// Every page used to fetch in onMounted, so the server HTML was an empty
// shell. These assert the real data now ships with the first response.
test('server-renders the public route list', async ({ page }) => {
    const response = await page.goto('/')
    expect((await response?.text()) ?? '').toContain('e2e-route-1')
})

test('server-renders a route detail page', async ({ page, request }) => {
    const list = await request.get(
        '/api/collections/averageRating/records?perPage=1',
    )
    const { id, name } = (await list.json()).items[0]

    const response = await page.goto(`/route?id=${id}`)
    const html = (await response?.text()) ?? ''

    // The record's own name, in the body and in the SSR'd <title>.
    expect(html).toContain('data-testid="route-page-name"')
    expect(html).toContain(name)
    expect(html).toMatch(new RegExp(`<title>[^<]*${name}[^<]*</title>`))
})

test.describe('admin pages', () => {
    for (const path of [
        '/admin/routes',
        '/admin/comments',
        '/admin/users',
        '/admin/analytics',
    ]) {
        test(`server-renders ${path}`, async ({ adminPage: page }) => {
            const response = await page.goto(path)
            expect(response?.status()).toBe(200)
            // A client-side redirect to login would mean the cookie auth
            // didn't reach the server.
            expect(page.url()).toContain(path)
            expect((await response?.text()) ?? '').not.toContain(
                'data-testid="login-form"',
            )
        })
    }
})

// pb.files.getURL() resolves against the SDK's base url, which is PocketBase's
// internal host on the server — those URLs must never reach the browser.
test('never ships internal-host file urls in the server html', async ({
    adminPage: page,
}) => {
    for (const path of ['/admin/users', '/admin/comments', '/admin/settings']) {
        const response = await page.goto(path)
        expect((await response?.text()) ?? '').not.toContain('localhost:8080')
    }
})

test('redirects a guarded page on the server, without rendering it', async ({
    page,
}) => {
    const response = await page.goto('/admin/routes')
    expect(page.url()).toContain('/auth/login')
    expect((await response?.text()) ?? '').not.toContain(
        'data-testid="routes-table"',
    )
})
