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

test('shows route details and the review call-to-action', async ({ page }) => {
    const id = await firstSeededRouteId(page)
    await gotoSettled(page, `/route?id=${id}`)
    await expect(page.getByTestId('route-page-name')).toBeVisible()
    await expect(page.getByTestId('review-open-cta')).toBeVisible()
})

test('redirects to 404 for a nonexistent route id', async ({ page }) => {
    await gotoSettled(page, '/route?id=nonexistent-e2e-id')
    await page.waitForURL('**/404')
})
