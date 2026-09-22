import { test, expect } from '../../support/fixtures'

test('server-renders the favicon, logo and logged-out navbar', async ({
    page,
}) => {
    const response = await page.goto('/')
    const html = (await response?.text()) ?? ''

    expect(html).toMatch(/<link[^>]+rel="icon"[^>]+href="[^"]+"/)
    expect(html).toMatch(/<img[^>]+alt="Logo"/)
    expect(html).toContain('data-testid="nav-login"')
})

test('server-renders the logged-in navbar', async ({ adminPage: page }) => {
    const response = await page.goto('/manage/routes')
    const html = (await response?.text()) ?? ''

    expect(html).toContain('data-testid="user-menu-activator"')
    expect(html).toContain('data-testid="nav-hamburger"')
    expect(html).toContain('/admin/settings')
})

test('the navbar logo actually loads', async ({ page }) => {
    await page.goto('/')

    const logo = page.locator('img[alt="Logo"]').first()
    await expect(logo).toBeVisible()

    await expect
        .poll(async () =>
            logo.evaluate((img: HTMLImageElement) => img.naturalWidth),
        )
        .toBeGreaterThan(0)

    const src = (await logo.getAttribute('src')) ?? ''
    if (src.includes('api/files')) expect(src).not.toContain('_ipx')
})
