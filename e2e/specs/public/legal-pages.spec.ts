import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('privacy page is server-rendered and public', async ({ page }) => {
    const response = await page.goto('/privacy')
    expect(response?.status()).toBe(200)
    const html = (await response?.text()) ?? ''
    expect(html).toContain('data-testid="privacy-storage"')
    expect(html).toContain('data-testid="privacy-rights"')
})

test('imprint page is public and links to privacy', async ({ page }) => {
    await gotoSettled(page, '/imprint')
    await expect(page.getByTestId('imprint-page')).toBeVisible()
    await page
        .getByTestId('imprint-page')
        .getByRole('link', { name: /privacy/i })
        .click()
    await expect(page).toHaveURL(/\/privacy$/)
})

test('logged-in users can open the legal pages', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/privacy', /\/privacy$/)
    await expect(page.getByTestId('privacy-page')).toBeVisible()
})

test('every cookie and localStorage key the app sets is disclosed', async ({
    adminPage: page,
    baseURL,
}) => {
    for (const path of [
        '/',
        '/manage/routes',
        '/manage/inventory',
        '/account/activity',
    ]) {
        await gotoSettled(page, path)
    }

    const appHost = new URL(baseURL!).hostname
    const cookieNames = (await page.context().cookies())
        .filter((cookie) => appHost.endsWith(cookie.domain.replace(/^\./, '')))
        .map((cookie) => cookie.name)
    const storageKeys = await page.evaluate(() => Object.keys(localStorage))
    const usedNames = [...new Set([...cookieNames, ...storageKeys])]
    expect(usedNames.length).toBeGreaterThan(0)

    await gotoSettled(page, '/privacy')
    const disclosedNames = await page
        .getByTestId('privacy-storage-row')
        .locator('code')
        .allTextContents()

    for (const name of usedNames) {
        expect(disclosedNames, `undisclosed client storage: ${name}`).toContain(
            name,
        )
    }
})
