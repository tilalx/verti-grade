import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('tells the admin no invite was sent when mail is not configured', async ({
    adminPage: page,
    testPrefix,
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
    await page.getByTestId('command-palette-input').fill('Users')
    await page.getByTestId('command-palette-result').first().click()
    await page.waitForURL('**/admin/users')

    await page.getByTestId('user-create-open').click()
    await expect(page.getByTestId('user-create-mail-warning')).toBeVisible()
    await page.getByTestId('user-create-firstname').fill('E2E')
    await page.getByTestId('user-create-lastname').fill('NoMail')
    await page
        .getByTestId('user-create-email')
        .fill(`${testPrefix}-nomail@gripello.test`)
    await page.getByTestId('user-create-submit').click()

    await expect(page.getByTestId('global-snackbar-message')).toContainText(
        /no invitation/i,
    )
    expect(inviteRequested).toBe(false)
})
