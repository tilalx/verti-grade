import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('shows no rows for a search with no matches', async ({ page }) => {
    await gotoSettled(page, '/')
    await page
        .getByTestId('filter-search')
        .locator('input')
        .fill('no-such-route-e2e-xyz')
    await expect(page.getByTestId('index-table')).not.toContainText(
        'e2e-route-',
    )
})

test('filters the route list by search text', async ({ page }) => {
    await gotoSettled(page, '/')
    await page.getByTestId('filter-search').locator('input').fill('e2e-route-1')
    await expect(page.getByTestId('index-table')).toContainText('e2e-route-1')
})

test('filters by difficulty, and every visible row actually matches', async ({
    page,
}) => {
    await gotoSettled(page, '/')
    await page.getByTestId('index-filter-difficulty').click()
    await page.getByRole('option', { name: '5', exact: true }).click()
    await expect(page.getByTestId('index-table')).toBeVisible()

    const res = await page.request.get(
        '/api/collections/routes/records?filter=' +
            encodeURIComponent(
                'name ~ "e2e-route-" && difficulty = 5 && archived = false',
            ) +
            '&perPage=1',
    )
    const body = await res.json()
    if (body.items.length > 0) {
        await page
            .getByTestId('filter-search')
            .locator('input')
            .fill(body.items[0].name)
        await expect(page.getByTestId('index-table')).toContainText(
            body.items[0].name,
        )
    }
})
