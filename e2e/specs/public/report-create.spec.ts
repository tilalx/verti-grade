import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

async function routeWithComment(page: import('@playwright/test').Page) {
    const res = await page.request.get(
        '/api/collections/ratings/records?filter=' +
            encodeURIComponent(
                'comment ~ "e2e-rating-" && route_id.archived = false',
            ) +
            '&perPage=1',
    )
    return (await res.json()).items[0].route_id as string
}

async function openReportDialog(page: import('@playwright/test').Page) {
    const routeId = await routeWithComment(page)
    await gotoSettled(page, `/route?id=${routeId}`)

    const reportButton = page.getByTestId('comment-card-report').first()
    await reportButton.waitFor()
    await reportButton.click()
    await expect(page.getByTestId('report-form-dialog')).toBeVisible()
}

async function fillValidReport(page: import('@playwright/test').Page) {
    await page.getByTestId('report-form-reason').click()
    await page.getByRole('option').first().click()
    await page
        .getByTestId('report-form-explanation')
        .locator('textarea')
        .first()
        .fill('This comment is abusive, e2e report')
    await page
        .getByTestId('report-form-name')
        .locator('input')
        .first()
        .fill('E2E Reporter')
    await page
        .getByTestId('report-form-email')
        .locator('input')
        .first()
        .fill('e2e-reporter@example.com')
}

test('an anonymous visitor can report a comment', async ({ page }) => {
    await openReportDialog(page)
    await fillValidReport(page)
    await page.getByTestId('report-form-goodfaith').locator('input').check()

    await page.getByTestId('report-form-submit').click()

    await expect(page.getByTestId('report-form-dialog')).toBeHidden()
    await expect(page.getByTestId('global-snackbar')).toBeVisible()
})

test('submit stays disabled until the good-faith declaration is accepted', async ({
    page,
}) => {
    await openReportDialog(page)
    await fillValidReport(page)

    await expect(page.getByTestId('report-form-submit')).toBeDisabled()

    await page.getByTestId('report-form-goodfaith').locator('input').check()
    await expect(page.getByTestId('report-form-submit')).toBeEnabled()
})

test('submit stays disabled for a malformed notifier email', async ({
    page,
}) => {
    await openReportDialog(page)
    await fillValidReport(page)
    await page.getByTestId('report-form-goodfaith').locator('input').check()
    await expect(page.getByTestId('report-form-submit')).toBeEnabled()

    await page
        .getByTestId('report-form-email')
        .locator('input')
        .first()
        .fill('not-an-email')

    await expect(page.getByTestId('report-form-submit')).toBeDisabled()
})

test('a failed submit surfaces an error and keeps the dialog open', async ({
    page,
}) => {
    await openReportDialog(page)
    await fillValidReport(page)
    await page.getByTestId('report-form-goodfaith').locator('input').check()

    const endpoint = '**/api/collections/reports/records'
    await page.route(endpoint, (route) => route.abort('failed'))

    await page.getByTestId('report-form-submit').click()

    await expect(page.getByTestId('global-snackbar')).toBeVisible()
    await expect(page.getByTestId('report-form-dialog')).toBeVisible()

    await page.unroute(endpoint)
})
