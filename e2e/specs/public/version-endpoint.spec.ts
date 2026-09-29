import { test, expect } from '../../support/fixtures'

test('/api/version is served by Nuxt through the proxy', async ({
    request,
}) => {
    const response = await request.get('/api/version')

    expect(response.status()).toBe(200)
    expect(await response.json()).toHaveProperty('mode')
})
