import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

// Vuetify 4's lg threshold (1145px) is where the card list hands over to the
// table, and just above it is the tightest the eleven columns ever get. The
// table used to overflow its wrapper here, so the row actions and the
// selection checkbox could only be reached by scrolling sideways.
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

    // Fitting must not come from squashing the last column's controls.
    await expect(page.getByTestId('routes-row-edit').first()).toBeVisible()
    const ratings = page.getByTestId('route-details-open').first()
    await expect(ratings).toBeVisible()
    const box = (await ratings.boundingBox())!
    expect(box.width).toBeGreaterThan(50)
})
