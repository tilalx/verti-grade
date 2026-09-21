import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('combines filter, sort, and pagination on the admin routes table', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')

    // Filter down to the seeded set so paging/sorting has a known scope.
    await page.getByTestId('filter-search').locator('input').fill('e2e-route-')
    await expect(page.getByTestId('routes-table')).toBeVisible()

    // Sort by name.
    await page.getByRole('columnheader', { name: /name/i }).click()
    const names = () =>
        page.locator('.route-manager__name-text').allTextContents()
    const page1Asc = await names()
    expect(page1Asc).toEqual([...page1Asc].sort((a, b) => a.localeCompare(b)))

    // Page forward — server-side pagination must fetch a different page,
    // not just slice what's already loaded.
    const nextPageButton = page.getByRole('button', { name: /next page/i })
    await expect(nextPageButton).toBeEnabled()
    await nextPageButton.click()
    await expect(page.getByTestId('routes-table')).toBeVisible()
    const page2Asc = await names()
    expect(page2Asc).not.toEqual(page1Asc)

    // The filter must still be applied on page 2 — every row still matches.
    for (const name of page2Asc) {
        expect(name).toContain('e2e-route-')
    }
})
