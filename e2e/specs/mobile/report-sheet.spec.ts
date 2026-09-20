import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

/**
 * specs/public/** only runs under desktop-en, so the bottom-sheet variant of
 * the report dialog needs its own file here — same split as review-sheet.
 */
test('report form opens as a bottom sheet on mobile', async ({ page }) => {
    // Derive the route from a comment that exists, rather than assuming the
    // first seeded route happens to have one.
    const res = await page.request.get(
        '/api/collections/ratings/records?filter=' +
            encodeURIComponent(
                'comment ~ "e2e-rating-" && route_id.archived = false',
            ) +
            '&perPage=1',
    )
    const routeId = (await res.json()).items[0].route_id as string

    await gotoSettled(page, `/route?id=${routeId}`)
    await page.getByTestId('comment-card-report').first().click()

    const dialog = page.getByTestId('report-form-dialog')
    await expect(dialog).toBeVisible()

    const viewport = page.viewportSize()!
    // Flush with the bottom edge and full width. Polled on absolute distance:
    // the sheet slides up, so the first visible frame is still below the fold.
    await expect
        .poll(async () => {
            const box = (await dialog.boundingBox())!
            return Math.abs(viewport.height - (box.y + box.height))
        })
        .toBeLessThanOrEqual(1)

    const box = (await dialog.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(viewport.width - 1)
})
