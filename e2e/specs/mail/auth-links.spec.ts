import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { waitForMail, linkPath, mailbox } from '../../support/mail'
import PocketBase from 'pocketbase'
import { authAsSuperuser, getRoleIds } from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'
const PASSWORD = 'E2eLinks!123'

async function createVerifiableUser(
    prefix: string,
    label: string,
    verified = true,
) {
    const pb = new PocketBase(PB_URL)
    await authAsSuperuser(pb)
    const roleIds = await getRoleIds(pb)
    const email = mailbox(prefix, label)

    const record = await pb.collection('users').create({
        email,
        emailVisibility: true,
        password: PASSWORD,
        passwordConfirm: PASSWORD,
        verified,
        username: `${prefix}${label}`.replace(/[^a-z0-9]/g, ''),
        firstname: 'E2E',
        name: 'Links',
        role: roleIds.user,
    })

    return { pb, email, id: record.id }
}

test('the verification mail links into the app, not the admin panel', async ({
    page,
    testPrefix,
}) => {
    const { pb, email, id } = await createVerifiableUser(
        testPrefix,
        'verify',
        false,
    )
    await pb.collection('users').requestVerification(email)

    const mail = await waitForMail(page, email, { subject: /verify/i })
    expect(mail.HTML).not.toContain('/_/#/')

    const path = linkPath(
        mail,
        /https?:\/\/[^"'\s]*\/auth\/confirm-verification\/[^"'\s]+/,
    )
    await gotoSettled(page, path)
    await expect(page.getByTestId('verify-done')).toBeVisible()

    const after = await pb.collection('users').getOne(id, { requestKey: null })
    expect(after.verified).toBe(true)

    await pb.collection('users').delete(id)
})

test('an email change confirms from the new address and then signs in', async ({
    page,
    testPrefix,
}) => {
    const { pb, email, id } = await createVerifiableUser(testPrefix, 'change')
    const newEmail = mailbox(testPrefix, 'changed')

    await gotoSettled(page, '/auth/login')
    await page.getByTestId('login-identity').locator('input').fill(email)
    await page.getByTestId('login-password').locator('input').fill(PASSWORD)
    await page.getByTestId('login-submit').click()
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'))

    await page.getByTestId('user-menu-activator').click()
    await page.getByTestId('user-menu-profile').click()
    await page.getByTestId('profile-email').locator('input').fill(newEmail)
    await page.getByTestId('profile-save').click()

    const mail = await waitForMail(page, newEmail, { subject: /email/i })
    expect(mail.HTML).not.toContain('/_/#/')

    const path = linkPath(
        mail,
        /https?:\/\/[^"'\s]*\/auth\/confirm-email-change\/[^"'\s]+/,
    )
    await gotoSettled(page, path)
    await page
        .getByTestId('email-change-password')
        .locator('input')
        .fill(PASSWORD)
    await page.getByTestId('email-change-submit').click()
    await expect(page.getByTestId('email-change-done')).toBeVisible()

    await gotoSettled(page, '/auth/login')
    await page.getByTestId('login-identity').locator('input').fill(newEmail)
    await page.getByTestId('login-password').locator('input').fill(PASSWORD)
    await page.getByTestId('login-submit').click()
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'))

    await pb.collection('users').delete(id)
})
