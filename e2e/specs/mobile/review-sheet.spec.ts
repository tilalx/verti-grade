import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('review form opens as a bottom sheet on mobile', async ({ page }) => {
    const res = await page.request.get(
        '/api/collections/routes/records?filter=' +
            encodeURIComponent('name ~ "e2e-route-" && archived = false') +
            '&perPage=1',
    )
    const id = (await res.json()).items[0].id as string

    await gotoSettled(page, `/route?id=${id}`)
    await page.getByTestId('review-open-cta').click()

    const dialog = page.getByTestId('review-form-dialog')
    await expect(dialog).toBeVisible()

    const viewport = page.viewportSize()!
    await expect
        .poll(async () => {
            const box = (await dialog.boundingBox())!
            return Math.abs(viewport.height - (box.y + box.height))
        })
        .toBeLessThanOrEqual(1)

    const box = (await dialog.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(viewport.width - 1)
})
