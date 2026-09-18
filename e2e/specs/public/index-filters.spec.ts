import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('filters the route list by search text', async ({ page }) => {
    await gotoSettled(page, '/')
    // e2e-route-1: seedRoutes archives every 10th route (i % 10 === 0), and
    // the public list hides archived routes by default — route 1 is safe.
    await page.getByTestId('filter-search').locator('input').fill('e2e-route-1')
    await expect(page.getByTestId('index-table')).toContainText('e2e-route-1')
})

test('filters by difficulty', async ({ page }) => {
    await gotoSettled(page, '/')
    await page.getByTestId('index-filter-difficulty').click()
    await page.getByRole('option', { name: '5', exact: true }).click()
    await expect(page.getByTestId('index-table')).toBeVisible()
})
