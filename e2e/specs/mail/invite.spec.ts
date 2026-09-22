import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'
import { waitForMail, linkPath, mailbox } from '../../support/mail'

/**
 * Creating a user used to produce a dead account: a random throwaway password
 * nobody knew, `verified` unset, and the users collection authRule is
 * `verified=true` — so the only way to finish the job was the PocketBase
 * superuser panel. The create flow now sends a password-reset mail, and
 * confirming it sets both the password AND verified, which is what makes the
 * account usable.
 */

const NEW_PASSWORD = 'E2eInvited!123'

test('an invited user can set a password from the mail and sign in', async ({
    adminPage: page,
    browser,
    testPrefix,
}) => {
    const email = mailbox(testPrefix, 'invite')

    await gotoSettled(page, '/admin/users', /\/admin\/users/)
    await page.getByTestId('user-create-open').click()
    await page.getByTestId('user-create-firstname').locator('input').fill('E2E')
    await page
        .getByTestId('user-create-lastname')
        .locator('input')
        .fill(`Invited${Date.now()}`)
    await page.getByTestId('user-create-email').locator('input').fill(email)
    await page.getByTestId('user-create-submit').click()
    await expect(page.getByTestId('user-create-dialog')).toBeHidden()

    const mail = await waitForMail(page, email, { subject: /password/i })
    // Not the superuser panel: /_/#/auth/... is what this used to link to.
    expect(mail.HTML).not.toContain('/_/#/')
    const path = linkPath(
        mail,
        /https?:\/\/[^"'\s]*\/auth\/confirm-password-reset\/[^"'\s]+/,
    )

    // A fresh context: the invited user is not the admin who created them.
    const context = await browser.newContext({
        baseURL: process.env.E2E_BASE_URL || 'https://vg.test',
        ignoreHTTPSErrors: true,
    })
    const invited = await context.newPage()

    await gotoSettled(invited, path)
    await invited
        .getByTestId('password-new')
        .locator('input')
        .fill(NEW_PASSWORD)
    await invited
        .getByTestId('password-confirm')
        .locator('input')
        .fill(NEW_PASSWORD)
    await invited.getByTestId('confirm-reset-submit').click()
    await expect(invited.getByTestId('reset-done')).toBeVisible()

    // The real assertion: the account works. Confirming the reset also set
    // verified=true, without which authRule rejects the login outright.
    await gotoSettled(invited, '/auth/login')
    await invited.getByTestId('login-identity').locator('input').fill(email)
    await invited
        .getByTestId('login-password')
        .locator('input')
        .fill(NEW_PASSWORD)
    await invited.getByTestId('login-submit').click()
    await invited.waitForURL((url) => !url.pathname.startsWith('/auth/login'))

    await context.close()

    // Clean up the invited account.
    const headers = await authHeader(page)
    const found = await page.request.get(
        '/api/collections/users/records?filter=' +
            encodeURIComponent(`email = "${email}"`),
        { headers },
    )
    const id = (await found.json()).items?.[0]?.id
    if (id) {
        await page.request.delete(`/api/collections/users/records/${id}`, {
            headers,
        })
    }
})
