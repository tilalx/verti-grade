import { test, expect } from '@playwright/test'

test('/api/version is served by Nuxt through the proxy', async ({
    request,
}) => {
    const response = await request.get('/api/version')

    expect(response.status()).toBe(200)
    expect(await response.json()).toHaveProperty('mode')
})
