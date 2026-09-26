import type { Page } from '@playwright/test'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { waitForMail, linkPath, mailbox, mailCount } from '../../support/mail'
import PocketBase from 'pocketbase'
import { authAsSuperuser, getRoleIds } from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'
const SETTINGS_ID = 'settings_123456'
const PASSWORD = 'E2eSignup!123'
const VERIFY_LINK = /https?:\/\/[^"'\s]*\/auth\/confirm-verification\/[^"'\s]+/

test.describe.configure({ mode: 'serial' })

let root: PocketBase

async function registrationAllowed() {
    const settings = await root
        .collection('settings')
        .getOne(SETTINGS_ID, { requestKey: null })
    return settings.allow_registration
}

async function setRegistration(allowed: boolean) {
    await root
        .collection('settings')
        .update(SETTINGS_ID, { allow_registration: allowed })
}

function signup(email: string, username: string, extra = {}) {
    return new PocketBase(PB_URL).collection('users').create({
        email,
        username,
        password: PASSWORD,
        passwordConfirm: PASSWORD,
        ...extra,
    })
}

async function signIn(page: Page, email: string) {
    await page.getByTestId('login-identity').locator('input').fill(email)
    await page.getByTestId('login-password').locator('input').fill(PASSWORD)
    await page.getByTestId('login-submit').click()
}

async function expectRejected(request: Promise<unknown>) {
    const error = (await request.catch((err) => err)) as { status?: number }
    expect(error.status).toBeGreaterThanOrEqual(400)
    expect(error.status).toBeLessThan(500)
}

test.beforeAll(async () => {
    root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
})

test.afterAll(async () => {
    await setRegistration(false)
})

test('registration is closed by default', async ({ page, testPrefix }) => {
    expect(await registrationAllowed()).toBe(false)

    await gotoSettled(page, '/auth/login')
    await expect(page.getByTestId('login-form')).toBeVisible()
    await expect(page.getByTestId('login-goto-register')).toHaveCount(0)

    await expectRejected(
        signup(
            mailbox(testPrefix, 'closed'),
            `${testPrefix}closed`.replace(/-/g, ''),
        ),
    )
})

test('an admin opens registration from the settings page', async ({
    adminPage,
    page,
}) => {
    await gotoSettled(adminPage, '/admin/settings')
    await adminPage
        .getByTestId('settings-allow-registration')
        .locator('input')
        .check()
    await adminPage.getByTestId('settings-save').click()
    await expect.poll(registrationAllowed).toBe(true)

    await gotoSettled(page, '/auth/login')
    await expect(page.getByTestId('login-goto-register')).toBeVisible()
})

test('a guest cannot pick their own role when signing up', async ({
    testPrefix,
}) => {
    await setRegistration(true)
    const { admin } = await getRoleIds(root)

    await expectRejected(
        signup(
            mailbox(testPrefix, 'escalate'),
            `${testPrefix}esc`.replace(/-/g, ''),
            { role: admin },
        ),
    )
})

test('a climber signs up, verifies the email and signs in', async ({
    page,
    testPrefix,
}) => {
    await setRegistration(true)
    const email = mailbox(testPrefix, 'signup')
    const username = `${testPrefix}signup`.replace(/-/g, '')

    await gotoSettled(page, '/auth/login')
    await page.getByTestId('login-goto-register').click()
    await page.getByTestId('register-username').locator('input').fill(username)
    await page.getByTestId('register-email').locator('input').fill(email)
    await page.getByTestId('password-new').locator('input').fill(PASSWORD)
    await page.getByTestId('password-confirm').locator('input').fill(PASSWORD)
    await page.getByTestId('register-submit').click()
    await expect(page.getByTestId('login-form')).toBeVisible()

    const created = await root
        .collection('users')
        .getFirstListItem(`email = "${email}"`, { requestKey: null })
    expect(created.verified).toBe(false)
    expect(created.role).toBe((await getRoleIds(root)).user)

    const mail = await waitForMail(page, email, { subject: /verify/i })
    await gotoSettled(page, linkPath(mail, VERIFY_LINK))
    await expect(page.getByTestId('verify-done')).toBeVisible()

    await gotoSettled(page, '/auth/login')
    await signIn(page, email)
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'))

    await root.collection('users').delete(created.id)
})

test('an unverified climber resends the verification mail from the sign-in page', async ({
    page,
    testPrefix,
}) => {
    const email = mailbox(testPrefix, 'resend')
    const created = await root.collection('users').create({
        email,
        username: `${testPrefix}resend`.replace(/-/g, ''),
        password: PASSWORD,
        passwordConfirm: PASSWORD,
        role: (await getRoleIds(root)).user,
    })
    expect(await mailCount(page, email)).toBe(0)

    await gotoSettled(page, '/auth/login')
    await signIn(page, email)
    await expect(page.getByTestId('login-unverified')).toBeVisible()
    await page.getByTestId('login-resend-verification').click()
    await expect(page.getByTestId('reset-email').locator('input')).toHaveValue(
        email,
    )
    await page.getByTestId('reset-submit').click()
    await expect(page.getByTestId('login-form')).toBeVisible()

    const mail = await waitForMail(page, email, { subject: /verify/i })
    await gotoSettled(page, linkPath(mail, VERIFY_LINK))
    await expect(page.getByTestId('verify-done')).toBeVisible()

    await root.collection('users').delete(created.id)
})
