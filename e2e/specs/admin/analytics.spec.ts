import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('renders analytics stats and charts', async ({ adminPage: page }) => {
    await gotoSettled(page, '/manage/analytics')

    const firstStat = page.locator('[data-testid^="analytics-stat-"]').first()
    await expect(firstStat).toBeVisible()
    await expect(firstStat.getByTestId('stats-card-value')).not.toHaveText('')

    for (const chart of [
        'analytics-chart-difficulty',
        'analytics-chart-route-timeline',
        'analytics-chart-route-setters',
        'analytics-chart-comment-timeline',
    ]) {
        const box = await page.getByTestId(chart).boundingBox()
        expect(box?.width).toBeGreaterThan(0)
        expect(box?.height).toBeGreaterThan(0)
    }
})

test('refresh button reloads analytics data', async ({ adminPage: page }) => {
    await gotoSettled(page, '/manage/analytics')
    await page.getByTestId('analytics-refresh').click()
    await expect(page.getByTestId('analytics-refresh')).toBeEnabled()
})

test('shows an error notification when the analytics fetch fails', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/analytics')
    await page.route('**/api/manage/analytics*', (route) =>
        route.fulfill({ status: 500, body: 'boom' }),
    )
    await page.getByTestId('analytics-refresh').click()
    await expect(page.getByTestId('global-snackbar')).toBeVisible()
})
