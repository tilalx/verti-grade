import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('stacks hero, details and reviews in one column on mobile', async ({
    page,
    route,
}) => {
    await gotoSettled(page, `/route?id=${route.id}`)

    await expect(async () => {
        const hero = (await page.getByTestId('route-hero').boundingBox())!
        const details = (await page.getByTestId('route-details').boundingBox())!
        const reviews = (await page.getByTestId('route-reviews').boundingBox())!

        expect(details.y).toBeGreaterThan(hero.y)
        expect(reviews.y).toBeGreaterThan(details.y)
        expect(Math.abs(reviews.x - details.x)).toBeLessThan(2)
    }).toPass()
})
