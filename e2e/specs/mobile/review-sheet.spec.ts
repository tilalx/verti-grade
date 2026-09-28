import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('review form opens as a bottom sheet on mobile', async ({
    page,
    route,
}) => {
    await gotoSettled(page, `/route?id=${route.id}`)
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

    await expect
        .poll(async () => (await dialog.boundingBox())!.width)
        .toBeGreaterThanOrEqual(viewport.width - 1)
})
