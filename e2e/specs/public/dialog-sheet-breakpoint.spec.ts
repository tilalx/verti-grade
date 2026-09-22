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

async function openReview(page: import('@playwright/test').Page) {
    const id = await firstSeededRouteId(page)
    await gotoSettled(page, `/route?id=${id}`)
    await page.getByTestId('review-open-cta').click()
    await expect(page.getByTestId('review-form-dialog')).toBeVisible()
}

test('docks to the bottom edge on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 850 })
    await openReview(page)

    const gap = await page
        .getByTestId('review-form-dialog')
        .evaluate((el) => innerHeight - el.getBoundingClientRect().bottom)
    expect(gap).toBeLessThanOrEqual(1)
})

test('centres as a dialog above phone width', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 850 })
    await openReview(page)

    const box = (await page.getByTestId('review-form-dialog').boundingBox())!
    expect(box.width).toBeLessThan(700)
    const offCentre = Math.abs(box.x + box.width / 2 - 700 / 2)
    expect(offCentre).toBeLessThanOrEqual(2)
})
