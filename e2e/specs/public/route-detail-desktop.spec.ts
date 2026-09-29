import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('puts route details beside the reviews under a full-width hero', async ({
    page,
    route,
}) => {
    await gotoSettled(page, `/route?id=${route.id}`)

    const hero = (await page.getByTestId('route-hero').boundingBox())!
    const details = (await page.getByTestId('route-details').boundingBox())!
    const reviews = (await page.getByTestId('route-reviews').boundingBox())!

    expect(hero.width).toBeGreaterThan(details.width * 2)
    expect(details.y).toBeGreaterThanOrEqual(hero.y + hero.height - 1)
    expect(reviews.x).toBeGreaterThanOrEqual(details.x + details.width)
})
