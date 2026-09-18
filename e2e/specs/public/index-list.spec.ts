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
