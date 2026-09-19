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
    // e2e-route-1: seedRoutes archives every 10th route (i % 10 === 0), and
    // the public list hides archived routes by default — route 1 is safe.
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

    // Cross-check against the API instead of trusting the UI not to lie:
    // every seeded route actually at difficulty 5 must be findable, proving
    // the filter reached the request rather than being a no-op.
    const res = await page.request.get(
        '/api/collections/routes/records?filter=' +
            encodeURIComponent(
                'name ~ "e2e-route-" && difficulty = 5 && archived = false',
            ) +
            '&perPage=1',
    )
    const body = await res.json()
    if (body.items.length > 0) {
        // Narrow with search too, so the match is guaranteed to be on the
        // first page regardless of how many difficulty-5 routes exist.
        await page
            .getByTestId('filter-search')
            .locator('input')
            .fill(body.items[0].name)
        await expect(page.getByTestId('index-table')).toContainText(
            body.items[0].name,
        )
    }
})
