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

test('puts route details beside the reviews under a full-width hero', async ({
    page,
}) => {
    const id = await firstSeededRouteId(page)
    await gotoSettled(page, `/route?id=${id}`)

    const hero = (await page.getByTestId('route-hero').boundingBox())!
    const details = (await page.getByTestId('route-details').boundingBox())!
    const reviews = (await page.getByTestId('route-reviews').boundingBox())!

    // Hero spans both columns, details and reviews share the row below it.
    expect(hero.width).toBeGreaterThan(details.width * 2)
    expect(details.y).toBeGreaterThanOrEqual(hero.y + hero.height - 1)
    expect(reviews.x).toBeGreaterThanOrEqual(details.x + details.width)
})
