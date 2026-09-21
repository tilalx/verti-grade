import { test, expect } from '../../support/fixtures'

// The navbar and custom branding used to appear only after hydration,
// flashing defaults first. All of it must now come down in the server HTML.
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
    // Permission-gated links resolve server-side too.
    expect(html).toContain('/admin/settings')
})

// Regression: the logo was rendered with <NuxtImg>, which rewrites the src
// through /_ipx. IPX cannot read PocketBase's uploads and answered 403, so a
// configured logo showed as a broken image in production. Whatever the logo
// resolves to, the browser must actually be able to load it.
test('the navbar logo actually loads', async ({ page }) => {
    await page.goto('/')

    const logo = page.locator('img[alt="Logo"]').first()
    await expect(logo).toBeVisible()

    // naturalWidth stays 0 for an image the browser failed to fetch.
    await expect
        .poll(async () =>
            logo.evaluate((img: HTMLImageElement) => img.naturalWidth),
        )
        .toBeGreaterThan(0)

    // A PocketBase upload must be served straight from PocketBase, never
    // wrapped in the image optimizer.
    const src = (await logo.getAttribute('src')) ?? ''
    if (src.includes('api/files')) expect(src).not.toContain('_ipx')
})
