import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

async function routeWithComment(page: import('@playwright/test').Page) {
    const res = await page.request.get(
        '/api/collections/ratings/records?filter=' +
            encodeURIComponent(
                'comment ~ "e2e-rating-" && route_id.archived = false',
            ) +
            '&perPage=1&expand=route_id',
    )
    const rating = (await res.json()).items[0]
    return {
        id: rating.route_id as string,
        name: rating.expand.route_id.name as string,
    }
}

async function openReviewsFor(
    page: import('@playwright/test').Page,
    route: { id: string; name: string },
) {
    await gotoSettled(page, '/')

    await page
        .getByTestId('filter-search')
        .locator('input')
        .first()
        .fill(route.name)

    const marker = page.getByTestId(`index-row-${route.id}`)
    await marker.waitFor()
    const row = page.locator('tr', { has: marker })
    await row.getByTestId('route-details-open').click()

    const dialog = page.getByTestId('route-details-sheet')
    await expect(dialog).toBeVisible()
    return dialog
}

test('the reviews dialog is centered on desktop, not pinned to the floor', async ({
    page,
}) => {
    const route = await routeWithComment(page)
    const dialog = await openReviewsFor(page, route)

    const viewport = page.viewportSize()!
    const box = (await dialog.boundingBox())!

    expect(viewport.height - (box.y + box.height)).toBeGreaterThan(24)
    expect(box.width).toBeLessThan(viewport.width)
})

test('reviews in the dialog can be reported', async ({ page }) => {
    const route = await routeWithComment(page)
    const dialog = await openReviewsFor(page, route)

    const reportButton = dialog.getByTestId('comment-card-report').first()
    await expect(reportButton).toBeVisible()
    await reportButton.click()

    await expect(page.getByTestId('report-form-dialog')).toBeVisible()
})

test('the reviews dialog close button has an accessible name', async ({
    page,
}) => {
    const route = await routeWithComment(page)
    const dialog = await openReviewsFor(page, route)

    await expect(dialog.getByTestId('dialog-close')).toBeVisible()
    await expect(page.getByRole('button', { name: /close/i })).toBeVisible()
})
