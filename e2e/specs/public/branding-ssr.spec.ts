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
    const response = await page.goto('/admin/routes')
    const html = (await response?.text()) ?? ''

    expect(html).toContain('data-testid="user-menu-activator"')
    expect(html).toContain('data-testid="nav-hamburger"')
    // Permission-gated links resolve server-side too.
    expect(html).toContain('/admin/settings')
})
