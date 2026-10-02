import PocketBase from 'pocketbase'
import { expect, test, type Page } from '@playwright/test'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'

export async function signInAs(page: Page, email: string, password: string) {
    const pb = new PocketBase(PB_URL)
    await pb.collection('users').authWithPassword(email, password)
    const cookie = pb.authStore.exportToCookie({}, 'pb_auth')
    const baseURL = test.info().project.use.baseURL!
    await page.context().addCookies([
        {
            name: 'pb_auth',
            value: cookie.slice('pb_auth='.length, cookie.indexOf(';')),
            url: baseURL,
        },
    ])
}

export async function fillLogin(
    page: Page,
    identity: string,
    password: string,
) {
    const identityInput = page.getByTestId('login-identity')
    const passwordInput = page.getByTestId('login-password')
    await expect(async () => {
        await identityInput.fill(identity)
        await passwordInput.fill(password)
        await expect(identityInput).toHaveValue(identity, { timeout: 500 })
        await expect(passwordInput).toHaveValue(password, { timeout: 500 })
    }).toPass()
}
