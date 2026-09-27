import type { Page } from '@playwright/test'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

async function signIn(page: Page, rememberMe: boolean) {
    await gotoSettled(page, '/auth/login')
    await page
        .getByTestId('login-identity')
        .locator('input')
        .fill('e2e-user@gripello.test')
    await page
        .getByTestId('login-password')
        .locator('input')
        .fill('E2ePassw0rd!')
    const checkbox = page.getByTestId('login-remember-me').locator('input')
    if ((await checkbox.isChecked()) !== rememberMe) await checkbox.click()
    await page.getByTestId('login-submit').click()
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'))
}

async function authCookie(page: Page) {
    const cookies = await page.context().cookies()
    return cookies.find((cookie) => cookie.name === 'pb_auth')
}

test('an unchecked remember me keeps the session only until the browser closes', async ({
    page,
}) => {
    await signIn(page, false)
    const cookie = await authCookie(page)
    expect(cookie?.expires).toBe(-1)

    await gotoSettled(page, '/account')
    expect((await authCookie(page))?.expires).toBe(-1)
})

test('a checked remember me keeps a persistent session', async ({ page }) => {
    await signIn(page, true)
    const cookie = await authCookie(page)
    expect(cookie?.expires).toBeGreaterThan(Date.now() / 1000)
})
