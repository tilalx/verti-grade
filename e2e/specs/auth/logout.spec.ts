import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('logs out and redirects to login', async ({ adminPage: page }) => {
    await gotoSettled(page, '/manage/routes', '**/manage/routes')
    const bannerActivator = page
        .getByRole('banner')
        .getByTestId('user-menu-activator')
    if (await bannerActivator.isVisible()) {
        await bannerActivator.click()
    } else {
        await page.getByTestId('bottom-nav-account').click()
        await page.getByTestId('me-logout').click()
        await page.waitForURL('**/auth/login')
        await expect(page.getByTestId('login-form')).toBeVisible()
        return
    }
    await page.getByTestId('user-menu-logout').click()
    await page.waitForURL('**/auth/login')
    await expect(page.getByTestId('login-form')).toBeVisible()
})
