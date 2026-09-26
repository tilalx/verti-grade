import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { waitForMail, linkPath, mailbox } from '../../support/mail'
import PocketBase from 'pocketbase'
import { authAsSuperuser, getRoleIds } from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'
const SETTINGS_ID = 'settings_123456'
const PASSWORD = 'E2eSignup!123'

test.describe.configure({ mode: 'serial' })

let root: PocketBase

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
    await setRegistration(false)

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

test('a guest cannot pick their own role when signing up', async ({
    testPrefix,
}) => {
    await setRegistration(true)
    const { admin } = await getRoleIds(root)

    await expectRejected(
        signup(
            mailbox(testPrefix, 'escalate'),
            `${testPrefix}esc`.replace(/-/g, ''),
            {
                role: admin,
            },
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
    await gotoSettled(
        page,
        linkPath(
            mail,
            /https?:\/\/[^"'\s]*\/auth\/confirm-verification\/[^"'\s]+/,
        ),
    )
    await expect(page.getByTestId('verify-done')).toBeVisible()

    await gotoSettled(page, '/auth/login')
    await page.getByTestId('login-identity').locator('input').fill(email)
    await page.getByTestId('login-password').locator('input').fill(PASSWORD)
    await page.getByTestId('login-submit').click()
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'))

    await root.collection('users').delete(created.id)
})
