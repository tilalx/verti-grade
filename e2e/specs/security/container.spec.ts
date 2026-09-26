import { test, expect } from '../../support/fixtures'
import { authHeader, gotoSettled } from '../../support/nav'

test('nginx still binds the privileged http port and redirects to https', async ({
    request,
    baseURL,
}) => {
    const httpUrl = new URL('/', baseURL).toString().replace('https:', 'http:')
    const response = await request.get(httpUrl, { maxRedirects: 0 })

    expect(response.status()).toBe(301)
    expect(response.headers().location).toMatch(/^https:\/\//)
})

test('nginx proxies to pocketbase over loopback', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBe(200)
})

test('nuxt server routes reach pocketbase over loopback', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/')
    const response = await page.request.get('/api/manage/analytics', {
        headers: await authHeader(page),
    })
    expect(response.status()).toBe(200)
})
