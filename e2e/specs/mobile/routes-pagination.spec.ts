import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'
import { LOCATIONS, locationId, uiaa } from '../../support/seed'

test('paginates the mobile route card list', async ({ adminPage: page }) => {
    const prefix = `e2e-pg-${Date.now()}`

    await gotoSettled(page, '/manage/routes')
    const headers = await authHeader(page)
    const hallA = await locationId(page, LOCATIONS[0])
    for (let i = 0; i < 12; i++) {
        await page.request.post('/api/collections/routes/records', {
            headers,
            data: {
                name: `${prefix}-${i}`,
                ...uiaa('5'),
                anchor_point: 5,
                location: hallA,
                type: 'Route',
                creator: ['E2E'],
                screw_date: '2026-01-01',
                archived: false,
            },
        })
    }

    await page.getByTestId('filter-search').locator('input').fill(prefix)
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
