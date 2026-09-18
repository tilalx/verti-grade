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

test('shows the invalid-link state for a bogus reset token', async ({
    page,
}) => {
    await gotoSettled(page, '/auth/confirm-password-reset/not-a-real-token')
    // Token is syntactically present, so the page renders the reset form;
    // submitting against PocketBase resolves to the invalid-token step.
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
