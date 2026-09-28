import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('changing the filter on page two jumps back to the first page', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')
    const search = page.getByTestId('filter-search').locator('input')
    const table = page.getByTestId('routes-table')
    const range = table.locator('.v-data-table-footer__info')

    await search.fill('e2e-route-')
    await expect(range).toContainText(/^\s*1\D/)
    await page.getByRole('button', { name: /next page/i }).click()
    await expect(range).not.toContainText(/^\s*1\D/)

    await search.fill('e2e-route')
    await expect(range).toContainText(/^\s*1\D/)
    await page.getByRole('button', { name: /next page/i }).click()
    await expect(range).toContainText(/^\s*26\D/)
})
