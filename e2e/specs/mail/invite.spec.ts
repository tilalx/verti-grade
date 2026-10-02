import { test, expect } from '../../support/fixtures'
import { fillLogin } from '../../support/auth'
import { gotoSettled } from '../../support/nav'
import { waitForMail, linkPath, mailbox } from '../../support/mail'

const NEW_PASSWORD = 'E2eInvited!123'

test('an invited user can set a password from the mail and sign in', async ({
    adminPage: page,
    page: invited,
    testPrefix,
}) => {
    test.slow()
    const email = mailbox(testPrefix, 'invite')

    await gotoSettled(page, '/admin/users', /\/admin\/users/)
    await page.getByTestId('user-create-open').click()
    await page.getByTestId('user-create-firstname').fill('E2E')
    await page.getByTestId('user-create-lastname').fill('Invited')
    await page.getByTestId('user-create-email').fill(email)
    await page.getByTestId('user-create-submit').click()
    await expect(page.getByTestId('user-create-dialog')).toBeHidden()

    const mail = await waitForMail(page, email, { subject: /password/i })
    expect(mail.HTML).not.toContain('/_/#/')
    const path = linkPath(
        mail,
        /https?:\/\/[^"'\s]*\/auth\/confirm-password-reset\/[^"'\s]+/,
    )

    await gotoSettled(invited, path)
    await invited.getByTestId('password-new').fill(NEW_PASSWORD)
    await invited.getByTestId('password-confirm').fill(NEW_PASSWORD)
    await invited.getByTestId('confirm-reset-submit').click()
    await expect(invited.getByTestId('reset-done')).toBeVisible()

    await gotoSettled(invited, '/auth/login')
    await fillLogin(invited, email, NEW_PASSWORD)
    await invited.getByTestId('login-submit').click()
    await invited.waitForURL((url) => !url.pathname.startsWith('/auth/login'))
})
