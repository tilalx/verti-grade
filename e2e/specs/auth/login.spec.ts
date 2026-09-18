import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test.describe('login', () => {
    test('logs in with valid credentials and lands on the dashboard', async ({
        page,
    }) => {
        await gotoSettled(page, '/auth/login')
        await page
            .getByTestId('login-identity')
            .locator('input')
            .fill('e2e-admin@verti-grade.test')
        await page
            .getByTestId('login-password')
            .locator('input')
            .fill('E2ePassw0rd!')
        await page.getByTestId('login-submit').click()
        await page.waitForURL('**/admin/routes')
        await expect(page.getByTestId('routes-create-open')).toBeVisible()
    })

    test('shows an error for invalid credentials', async ({ page }) => {
        await gotoSettled(page, '/auth/login')
        await page
            .getByTestId('login-identity')
            .locator('input')
            .fill('e2e-admin@verti-grade.test')
        await page
            .getByTestId('login-password')
            .locator('input')
            .fill('wrong-password')
        await page.getByTestId('login-submit').click()
        await expect(page.getByTestId('global-snackbar')).toBeVisible()
        await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('navigates to the password-reset request form', async ({ page }) => {
        await gotoSettled(page, '/auth/login')
        await page.getByTestId('login-goto-reset').click()
        await expect(page.getByTestId('reset-form')).toBeVisible()
        await expect(page.getByTestId('reset-email')).toBeVisible()
    })
})
