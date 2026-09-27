import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { authAsSuperuser } from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'
const SETTINGS_ID = 'settings_123456'

test.describe.configure({ mode: 'serial' })

let root: PocketBase
let registrationWasAllowed = false

test.beforeAll(async () => {
    root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const settings = await root
        .collection('settings')
        .getOne(SETTINGS_ID, { requestKey: null })
    registrationWasAllowed = !!settings.allow_registration
    await root
        .collection('settings')
        .update(SETTINGS_ID, { allow_registration: true })
})

test.afterAll(async () => {
    await root
        .collection('settings')
        .update(SETTINGS_ID, { allow_registration: registrationWasAllowed })
})

test('the guest register button opens the registration form', async ({
    page,
}) => {
    await gotoSettled(page, '/account')
    await page.getByTestId('me-register').click()

    await page.waitForURL(/\/auth\/login\?.*view=register/)
    await expect(page.getByTestId('register-form')).toBeVisible()
})

test('the register view can be opened directly by url', async ({ page }) => {
    const response = await page.goto('/auth/login?view=register')
    expect(response?.status()).toBe(200)
    await gotoSettled(page, '/auth/login?view=register')
    await expect(page.getByTestId('register-form')).toBeVisible()
})
