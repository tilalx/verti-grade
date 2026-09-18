import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

async function firstSeededRouteId(page: import('@playwright/test').Page) {
    const res = await page.request.get(
        '/api/collections/routes/records?filter=' +
            encodeURIComponent('name ~ "e2e-route-" && archived = false') +
            '&perPage=1',
    )
    const body = await res.json()
    return body.items[0].id as string
}

test('an anonymous visitor can submit a review', async ({ page }) => {
    const id = await firstSeededRouteId(page)
    await gotoSettled(page, `/route?id=${id}`)

    await page.getByTestId('review-open-cta').click()
    await expect(page.getByTestId('review-form-dialog')).toBeVisible()

    await page
        .getByTestId('review-form-rating')
        .locator('button, [role="radio"]')
        .last()
        .click()
    await page.getByTestId('review-form-difficulty').click()
    await page.getByRole('option').first().click()
    await page
        .getByTestId('review-form-comment')
        .locator('textarea')
        .first()
        .fill('Great climb, e2e review')
    await page.getByTestId('review-form-submit').click()

    await expect(page.getByTestId('review-form-dialog')).toBeHidden()
})
