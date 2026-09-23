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

test('heatmap switches years and setters toggle groups single routes', async ({
    adminPage: page,
}) => {
    const year = new Date().getFullYear()
    await page.setViewportSize({ width: 1280, height: 900 })
    await gotoSettled(page, '/manage/analytics')
    await page.route('**/api/manage/analytics*', async (route) => {
        const response = await route.fetch()
        const body = await response.json()
        await route.fulfill({
            response,
            json: {
                ...body,
                routeTimeline: [
                    { period: `${year - 1}-06-10`, count: 3 },
                    { period: `${year}-02-01`, count: 1 },
                ],
                routeSetters: [
                    { setter: 'Alice', count: 5 },
                    { setter: 'Bob', count: 1 },
                    { setter: 'Carol', count: 1 },
                ],
            },
        })
    })
    await page.getByTestId('analytics-refresh').click()
    await expect(page.getByTestId('analytics-refresh')).toBeEnabled()

    const heatmap = page.getByTestId('analytics-heatmap')
    await expect(heatmap.locator('[data-count="1"]')).toHaveCount(1)

    await page.getByTestId(`analytics-heatmap-year-${year - 1}`).click()
    await expect(heatmap.locator('[data-count="3"]')).toHaveCount(1)
    await expect(heatmap.locator('[data-count="1"]')).toHaveCount(0)

    const setterSwitch = page
        .getByTestId('analytics-show-all-setters')
        .locator('input')
    await expect(setterSwitch).not.toBeChecked()
    await setterSwitch.check()
    await expect(setterSwitch).toBeChecked()
})
