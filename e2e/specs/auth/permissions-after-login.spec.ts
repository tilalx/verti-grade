import type { Page } from '@playwright/test'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

async function signIn(page: Page) {
    await page
        .getByTestId('login-identity')
        .locator('input')
        .fill('e2e-routesetter@gripello.test')
    await page
        .getByTestId('login-password')
        .locator('input')
        .fill('E2ePassw0rd!')
    await page.getByTestId('login-submit').click()
}

async function logOut(page: Page) {
    if ((page.viewportSize()?.width ?? 0) >= 1280) {
        await page
            .getByRole('banner')
            .getByTestId('user-menu-activator')
            .click()
        await page.getByTestId('user-menu-logout').click()
    } else {
        await page.getByTestId('bottom-nav-account').click()
        await page.getByTestId('me-logout').click()
    }
    await page.waitForURL('**/auth/login**')
}

test('a guest who signs in keeps the redirect to a permission-guarded page', async ({
    page,
}) => {
    await gotoSettled(page, '/')
    await gotoSettled(page, '/manage/comments', /\/auth\/login/)
    await signIn(page)

    await page.waitForURL('**/manage/comments')
    await expect(page).toHaveURL(/\/manage\/comments/)
})

test('signing in again after a logout in the same session reaches the dashboard', async ({
    page,
}) => {
    await gotoSettled(page, '/auth/login?redirect=/manage/comments')
    await signIn(page)
    await page.waitForURL('**/manage/comments')

    await logOut(page)
    await signIn(page)

    await page.waitForURL('**/manage/routes')
    await expect(page.getByTestId('routes-create-open')).toBeVisible()
})
