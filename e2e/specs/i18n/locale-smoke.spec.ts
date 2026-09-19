import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('login page renders in the browser Accept-Language locale', async ({
    page,
}) => {
    await gotoSettled(page, '/auth/login')
    await expect(page.getByTestId('login-form')).toBeVisible()
    // No URL segment or cookie carries the locale (strategy: no_prefix,
    // detectBrowserLanguage.useCookie: false) — Accept-Language is the only
    // lever, set per-project via the Playwright context `locale`.
    await expect(page).toHaveURL(/\/auth\/login$/)
})

test('public route list renders in the browser Accept-Language locale', async ({
    page,
}) => {
    await gotoSettled(page, '/')
    await expect(
        page
            .getByTestId('index-table')
            .or(page.locator('.route-card[data-testid^="route-card-"]').first()),
    ).toBeVisible()
})
