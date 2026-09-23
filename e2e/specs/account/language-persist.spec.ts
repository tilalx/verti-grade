import PocketBase from 'pocketbase'
import type { Browser, Page } from '@playwright/test'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { authAsSuperuser, ensureUser, getRoleIds } from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'

async function loginInFreshContext(
    browser: Browser,
    baseURL: string,
    email: string,
    password: string,
): Promise<Page> {
    const context = await browser.newContext({
        baseURL,
        ignoreHTTPSErrors: true,
        locale: 'en-US',
    })
    const page = await context.newPage()
    await gotoSettled(page, '/auth/login')
    await page.getByTestId('login-identity').locator('input').fill(email)
    await page.getByTestId('login-password').locator('input').fill(password)
    await page.getByTestId('login-submit').click()
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'))
    return page
}

test('the chosen language is saved on the user and restored on the next login', async ({
    browser,
    baseURL,
    testPrefix,
}) => {
    const pb = new PocketBase(PB_URL)
    await authAsSuperuser(pb)
    const roleIds = await getRoleIds(pb)
    const user = await ensureUser(pb, roleIds.user, 'user', `${testPrefix}lang`)

    const firstSession = await loginInFreshContext(
        browser,
        baseURL!,
        user.email,
        user.password,
    )
    await expect(firstSession.locator('html')).toHaveAttribute('lang', 'en')
    await firstSession.getByTestId('user-menu-activator').click()
    await firstSession.getByTestId('user-menu-profile').click()
    await firstSession.getByTestId('profile-language').click()
    await firstSession.getByTestId('profile-language-de').click()
    await expect(firstSession.locator('html')).toHaveAttribute('lang', 'en')
    await firstSession.getByTestId('profile-save').click()
    await expect(firstSession.getByTestId('profile-dialog')).toBeHidden()
    await expect(firstSession.locator('html')).toHaveAttribute('lang', 'de')
    await expect
        .poll(
            async () => (await pb.collection('users').getOne(user.id)).language,
        )
        .toBe('de')
    await firstSession.context().close()

    const secondSession = await loginInFreshContext(
        browser,
        baseURL!,
        user.email,
        user.password,
    )
    await expect(secondSession.locator('html')).toHaveAttribute('lang', 'de')

    const ssrResponse = await secondSession.goto('/')
    expect(await ssrResponse!.text()).toContain('lang="de"')

    await secondSession.context().close()
    await pb.collection('users').delete(user.id)
})
