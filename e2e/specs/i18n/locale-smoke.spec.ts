import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('login page renders in the browser Accept-Language locale', async ({
    page,
}) => {
    await gotoSettled(page, '/auth/login')
    await expect(page.getByTestId('login-form')).toBeVisible()
    await expect(page).toHaveURL(/\/auth\/login$/)
})

test('public route list renders in the browser Accept-Language locale', async ({
    page,
}) => {
    await gotoSettled(page, '/')
    await expect(
        page
            .getByTestId('index-table')
            .or(
                page.locator('.route-card[data-testid^="route-card-"]').first(),
            ),
    ).toBeVisible()
})
