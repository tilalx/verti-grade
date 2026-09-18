import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('logs out and redirects to login', async ({ adminPage: page }) => {
    await gotoSettled(page, '/admin/routes')
    // The drawer's UserIcon stays mounted off-canvas even on desktop
    // (Vuetify keeps v-navigation-drawer content in the DOM), so two
    // "user-menu-activator" buttons can exist. On desktop the app-bar one
    // is visible; on mobile the app-bar doesn't render one at all and the
    // drawer must be opened first to reach its off-canvas copy.
    const bannerActivator = page
        .getByRole('banner')
        .getByTestId('user-menu-activator')
    if (await bannerActivator.count()) {
        await bannerActivator.click()
    } else {
        await page.getByTestId('nav-hamburger').click()
        await page.getByTestId('nav-drawer').getByTestId('user-menu-activator').click()
    }
    await page.getByTestId('user-menu-logout').click()
    await page.waitForURL('**/auth/login')
    await expect(page.getByTestId('login-form')).toBeVisible()
})
