import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test.use({ viewport: { width: 1160, height: 900 } })

test('the routes table fits without sideways scrolling', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')
    await expect(page.getByTestId('routes-table')).toBeVisible()

    const overflow = await page
        .locator('.v-table__wrapper')
        .evaluate((el) => el.scrollWidth - el.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)

    await expect(page.getByTestId('routes-row-edit').first()).toBeVisible()
    const ratings = page.getByTestId('route-details-open').first()
    await expect(ratings).toBeVisible()
    const box = (await ratings.boundingBox())!
    expect(box.width).toBeGreaterThan(50)
})
