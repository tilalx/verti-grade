import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('shows the public route list unauthenticated', async ({ page }) => {
    await gotoSettled(page, '/')
    await expect(page.getByTestId('index-table')).toBeVisible()
})

test('nav shows a login button when logged out', async ({ page }) => {
    await gotoSettled(page, '/')
    await expect(page.getByTestId('nav-login')).toBeVisible()
})

test('a route name in the list opens its detail page', async ({ page }) => {
    await gotoSettled(page, '/')
    const link = page.getByTestId('index-row-link').first()
    const name = (await link.textContent())!.trim()
    await link.click()
    await page.waitForURL(/\/route\?id=/)
    await expect(page.getByTestId('route-page-name')).toHaveText(name)
})
