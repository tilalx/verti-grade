import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('logs out and redirects to login', async ({ adminPage: page }) => {
    await gotoSettled(page, '/admin/routes', '**/admin/routes')
    // The app-bar UserIcon is server-rendered on both breakpoints and hidden
    // by CSS below md, so it's always in the DOM — visibility, not presence,
    // says which one to use. On mobile the drawer must be opened first to
    // reach its off-canvas copy.
    const bannerActivator = page
        .getByRole('banner')
        .getByTestId('user-menu-activator')
    if (await bannerActivator.isVisible()) {
        await bannerActivator.click()
    } else {
        await page.getByTestId('nav-hamburger').click()
        await page
            .getByTestId('nav-drawer')
            .getByTestId('user-menu-activator')
            .click()
    }
    await page.getByTestId('user-menu-logout').click()
    await page.waitForURL('**/auth/login')
    await expect(page.getByTestId('login-form')).toBeVisible()
})
