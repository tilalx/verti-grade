import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('submits a password reset request', async ({ page }) => {
    await gotoSettled(page, '/auth/login')
    await page.getByTestId('login-goto-reset').click()
    await page
        .getByTestId('reset-email')
        .locator('input')
        .fill('e2e-user@verti-grade.test')
    await page.getByTestId('reset-submit').click()
    await expect(page.getByTestId('global-snackbar')).toBeVisible()
})

test('blocks a reset request with an invalid email', async ({ page }) => {
    await gotoSettled(page, '/auth/login')
    await page.getByTestId('login-goto-reset').click()
    await page.getByTestId('reset-email').locator('input').fill('not-an-email')
    await page.getByTestId('reset-submit').click()

    await expect(page.getByTestId('reset-form')).toBeVisible()
    await expect(page.getByTestId('global-snackbar')).toBeHidden()
})

test('shows an error when the reset request fails outright', async ({
    page,
}) => {
    await gotoSettled(page, '/auth/login')
    await page.getByTestId('login-goto-reset').click()
    await page.route(
        '**/api/collections/users/request-password-reset',
        (route) => route.abort('failed'),
    )
    await page
        .getByTestId('reset-email')
        .locator('input')
        .fill('e2e-user@verti-grade.test')
    await page.getByTestId('reset-submit').click()
    await expect(page.getByTestId('global-snackbar')).toBeVisible()
    await expect(page.getByTestId('reset-form')).toBeVisible()
})

test('shows the invalid-link state for a bogus reset token', async ({
    page,
}) => {
    await gotoSettled(page, '/auth/confirm-password-reset/not-a-real-token')
    await page
        .getByTestId('password-new')
        .locator('input')
        .fill('NewPassw0rd!123')
    await page
        .getByTestId('password-confirm')
        .locator('input')
        .fill('NewPassw0rd!123')
    const submit = page.getByTestId('confirm-reset-submit')
    await expect(submit).toBeEnabled()
    await submit.click()
    await expect(page.getByTestId('reset-invalid')).toBeVisible()
})
