import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('combines filter, sort, and pagination on the admin routes table', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')

    await page.getByTestId('filter-search').locator('input').fill('e2e-route-')
    await expect(page.getByTestId('routes-table')).toBeVisible()

    await page.getByRole('columnheader', { name: /name/i }).click()
    const names = () =>
        page.locator('.route-manager__name-text').allTextContents()
    const page1Asc = await names()
    expect(page1Asc).toEqual([...page1Asc].sort((a, b) => a.localeCompare(b)))

    const nextPageButton = page.getByRole('button', { name: /next page/i })
    await expect(nextPageButton).toBeEnabled()
    await nextPageButton.click()
    await expect(page.getByTestId('routes-table')).toBeVisible()
    const page2Asc = await names()
    expect(page2Asc).not.toEqual(page1Asc)

    for (const name of page2Asc) {
        expect(name).toContain('e2e-route-')
    }
})
