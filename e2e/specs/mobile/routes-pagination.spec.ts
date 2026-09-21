import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'

test('paginates the mobile route card list', async ({ adminPage: page }) => {
    // admin/routes.vue subscribes to realtime 'routes'/'ratings' changes and
    // silently reloads on ANY mutation, including from unrelated spec files
    // running concurrently against the same shared seed pool. Asserting an
    // absolute card count against that shared pool is inherently flaky, so
    // this test uses its own uniquely-prefixed routes and filters to them —
    // realtime reloads then still return the same (unaffected) count.
    const prefix = `e2e-pg-${Date.now()}`

    await gotoSettled(page, '/manage/routes')
    const headers = await authHeader(page)
    for (let i = 0; i < 12; i++) {
        await page.request.post('/api/collections/routes/records', {
            headers,
            data: {
                name: `${prefix}-${i}`,
                difficulty: 5,
                anchor_point: 5,
                location: 'Hanau',
                type: 'Route',
                creator: ['E2E'],
                screw_date: '2026-01-01',
                archived: false,
            },
        })
    }

    await page.getByTestId('filter-search').locator('input').fill(prefix)
    // Search is debounced (300ms) before it re-fetches; wait for the filter
    // to actually take effect (all 12 own routes, default page size) before
    // changing the page size, or that change races the still-unfiltered list.
    await expect(page.locator('.route-card[data-testid^="route-card-"]')).toHaveCount(12)
    await expect(page.getByTestId('routes-mobile-pagination')).toBeVisible()

    await page.getByTestId('routes-mobile-page-size').click()
    const routesResponse = page.waitForResponse((res) =>
        res.url().includes('/api/collections/averageRating/records'),
    )
    await page.getByRole('option', { name: '10', exact: true }).click()
    await routesResponse
    await expect(page.locator('.route-card[data-testid^="route-card-"]')).toHaveCount(10)
})
