import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

/**
 * The verification mail used to link into the PocketBase superuser panel
 * (/_/#/auth/confirm-verification/...). It now lands here.
 */

test('shows the invalid-link state for a bogus verification token', async ({
    page,
}) => {
    await gotoSettled(page, '/auth/confirm-verification/not-a-real-token')
    // No form to submit: the token is the whole request, so it resolves on
    // mount straight to the invalid state.
    await expect(page.getByTestId('verify-invalid')).toBeVisible()
})

test('confirms a verification token and offers sign-in', async ({ page }) => {
    await page.route('**/api/collections/users/confirm-verification', (route) =>
        route.fulfill({ status: 204, body: '' }),
    )

    await gotoSettled(page, '/auth/confirm-verification/looks-like-a-token')
    await expect(page.getByTestId('verify-done')).toBeVisible()

    await page.getByTestId('verify-goto-login').click()
    await page.waitForURL(/\/auth\/login/)
})
