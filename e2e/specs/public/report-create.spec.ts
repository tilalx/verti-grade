import type { Page } from '@playwright/test'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { uiaa } from '../../support/seed'

test.beforeEach(async ({ root, route, testPrefix }) => {
    await root.collection('ratings').create({
        route_id: route.id,
        rating: 2,
        ...uiaa('5'),
        comment: `${testPrefix}-reportable`,
    })
})

async function openReportDialog(page: Page, routeId: string) {
    await gotoSettled(page, `/route?id=${routeId}`)

    const reportButton = page.getByTestId('comment-card-report').first()
    await reportButton.waitFor()
    await reportButton.click()
    await expect(page.getByTestId('report-form-dialog')).toBeVisible()
}

async function fillValidReport(page: Page, testPrefix: string) {
    await page.getByTestId('report-form-reason').click()
    await page.getByRole('option').first().click()
    await page
        .getByTestId('report-form-explanation')
        .locator('textarea')
        .first()
        .fill(`${testPrefix} this comment is abusive`)
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

test('an anonymous visitor can report a comment', async ({
    page,
    route,
    testPrefix,
}) => {
    await openReportDialog(page, route.id)
    await fillValidReport(page, testPrefix)
    await page.getByTestId('report-form-goodfaith').locator('input').check()

    await page.getByTestId('report-form-submit').click()

    await expect(page.getByTestId('report-form-dialog')).toBeHidden()
    await expect(page.getByTestId('global-snackbar')).toBeVisible()
})

test('submit stays disabled until the good-faith declaration is accepted', async ({
    page,
    route,
    testPrefix,
}) => {
    await openReportDialog(page, route.id)
    await fillValidReport(page, testPrefix)

    await expect(page.getByTestId('report-form-submit')).toBeDisabled()

    await page.getByTestId('report-form-goodfaith').locator('input').check()
    await expect(page.getByTestId('report-form-submit')).toBeEnabled()
})

test('submit stays disabled for a malformed notifier email', async ({
    page,
    route,
    testPrefix,
}) => {
    await openReportDialog(page, route.id)
    await fillValidReport(page, testPrefix)
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
    route,
    testPrefix,
}) => {
    await openReportDialog(page, route.id)
    await fillValidReport(page, testPrefix)
    await page.getByTestId('report-form-goodfaith').locator('input').check()

    const endpoint = '**/api/collections/reports/records'
    await page.route(endpoint, (route) => route.abort('failed'))

    await page.getByTestId('report-form-submit').click()

    await expect(page.getByTestId('global-snackbar')).toBeVisible()
    await expect(page.getByTestId('report-form-dialog')).toBeVisible()

    await page.unroute(endpoint)
})
