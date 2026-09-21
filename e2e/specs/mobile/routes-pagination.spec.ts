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
    await expect(
        page.locator('.route-card[data-testid^="route-card-"]'),
    ).toHaveCount(12)
    await expect(page.getByTestId('routes-mobile-pagination')).toBeVisible()

    await page.getByTestId('routes-mobile-page-size').click()
    const routesResponse = page.waitForResponse((res) =>
        res.url().includes('/api/collections/averageRating/records'),
    )
    await page.getByRole('option', { name: '10', exact: true }).click()
    await routesResponse
    await expect(
        page.locator('.route-card[data-testid^="route-card-"]'),
    ).toHaveCount(10)

    // The number strip is a window around the current page, so the count of
    // buttons follows the width rather than the number of pages.
    await expect(page.getByTestId('routes-mobile-goto-1')).toHaveAttribute(
        'aria-current',
        'page',
    )
    await expect(page.getByTestId('routes-mobile-prev')).toBeDisabled()

    await page.getByTestId('routes-mobile-next').click()
    await expect(page.getByTestId('routes-mobile-goto-2')).toHaveAttribute(
        'aria-current',
        'page',
    )
    await expect(
        page.locator('.route-card[data-testid^="route-card-"]'),
    ).toHaveCount(2)
    await expect(page.getByTestId('routes-mobile-next')).toBeDisabled()

    // A number jumps straight there, which is the point of having them back.
    await page.getByTestId('routes-mobile-goto-1').click()
    await expect(page.getByTestId('routes-mobile-goto-1')).toHaveAttribute(
        'aria-current',
        'page',
    )
    await expect(
        page.locator('.route-card[data-testid^="route-card-"]'),
    ).toHaveCount(10)
})

test('the pager stays under the thumb while stepping', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')
    await expect(page.getByTestId('routes-mobile-pagination')).toBeVisible()

    // Pages hold cards of differing heights, so a pager that simply followed
    // the last card landed somewhere new on every tap and the next button
    // slid out from under the finger mid-click.
    const next = page.getByTestId('routes-mobile-next')
    await next.click()
    await expect(page.getByTestId('routes-mobile-goto-2')).toHaveAttribute(
        'aria-current',
        'page',
    )
    const afterFirst = (await next.boundingBox())!

    await next.click()
    await expect(page.getByTestId('routes-mobile-goto-3')).toHaveAttribute(
        'aria-current',
        'page',
    )
    const afterSecond = (await next.boundingBox())!

    expect(afterSecond.y).toBeCloseTo(afterFirst.y, 0)
    expect(afterSecond.x).toBeCloseTo(afterFirst.x, 0)
})
