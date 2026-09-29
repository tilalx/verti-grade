import type { Page } from '@playwright/test'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

async function openReview(page: Page, routeId: string) {
    await gotoSettled(page, `/route?id=${routeId}`)
    await page.getByTestId('review-open-cta').click()
    await expect(page.getByTestId('review-form-dialog')).toBeVisible()
}

test('docks to the bottom edge on a phone', async ({ page, route }) => {
    await page.setViewportSize({ width: 500, height: 850 })
    await openReview(page, route.id)

    await expect
        .poll(() =>
            page
                .getByTestId('review-form-dialog')
                .evaluate(
                    (el) => innerHeight - el.getBoundingClientRect().bottom,
                ),
        )
        .toBeLessThanOrEqual(1)
})

test('centres as a dialog above phone width', async ({ page, route }) => {
    await page.setViewportSize({ width: 700, height: 850 })
    await openReview(page, route.id)

    const dialog = page.getByTestId('review-form-dialog')
    await expect
        .poll(async () => {
            const box = (await dialog.boundingBox())!
            return {
                narrower: box.width < 700,
                centred: Math.abs(box.x + box.width / 2 - 700 / 2) <= 2,
            }
        })
        .toEqual({ narrower: true, centred: true })
})
