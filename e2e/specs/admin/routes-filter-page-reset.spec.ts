import { test, expect } from '../../support/fixtures'
import { gotoSettled, searchRoutes } from '../../support/nav'

test('changing the filter on page two jumps back to the first page', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')
    const range = page
        .getByTestId('routes-table')
        .locator('.v-data-table-footer__info')

    await searchRoutes(page, 'e2e-route-')
    await expect(range).toContainText(/^\s*1\D/)
    await page.getByRole('button', { name: /next page/i }).click()
    await expect(range).not.toContainText(/^\s*1\D/)

    await searchRoutes(page, 'e2e-route')
    await expect(range).toContainText(/^\s*1\D/)
    await page.getByRole('button', { name: /next page/i }).click()
    await expect(range).toContainText(/^\s*26\D/)
})
