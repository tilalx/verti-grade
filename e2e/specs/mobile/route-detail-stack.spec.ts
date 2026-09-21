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

test('stacks hero, details and reviews in one column on mobile', async ({
    page,
}) => {
    const id = await firstSeededRouteId(page)
    await gotoSettled(page, `/route?id=${id}`)

    const hero = (await page.getByTestId('route-hero').boundingBox())!
    const details = (await page.getByTestId('route-details').boundingBox())!
    const reviews = (await page.getByTestId('route-reviews').boundingBox())!

    expect(details.y).toBeGreaterThan(hero.y)
    expect(reviews.y).toBeGreaterThan(details.y)
    expect(Math.abs(reviews.x - details.x)).toBeLessThan(2)
})
