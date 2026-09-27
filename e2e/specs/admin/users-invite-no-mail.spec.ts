import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('tells the admin no invite was sent when mail is not configured', async ({
    adminPage: page,
}) => {
    await page.route('**/api/mail-status', (route) =>
        route.fulfill({ json: { configured: false } }),
    )
    let inviteRequested = false
    page.on('request', (request) => {
        if (request.url().includes('/request-password-reset'))
            inviteRequested = true
    })

    await gotoSettled(page, '/')
    await page.getByTestId('command-palette-open').click()
    await page
        .getByTestId('command-palette-input')
        .locator('input')
        .fill('Users')
    await page.getByTestId('command-palette-result').first().click()
    await page.waitForURL('**/admin/users')

    const suffix = Date.now()
    await page.getByTestId('user-create-open').click()
    await expect(page.getByTestId('user-create-mail-warning')).toBeVisible()
    await page.getByTestId('user-create-firstname').locator('input').fill('E2E')
    await page
        .getByTestId('user-create-lastname')
        .locator('input')
        .fill(`NoMail${suffix}`)
    await page
        .getByTestId('user-create-email')
        .locator('input')
        .fill(`e2e-nomail-${suffix}@gripello.test`)
    await page.getByTestId('user-create-submit').click()

    await expect(page.getByTestId('global-snackbar-message')).toContainText(
        /no invitation/i,
    )
    expect(inviteRequested).toBe(false)
})
