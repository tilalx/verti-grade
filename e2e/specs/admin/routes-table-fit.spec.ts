import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test.use({ viewport: { width: 1160, height: 900 } })

test('the routes table fits without sideways scrolling', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')
    await expect(page.getByTestId('routes-table')).toBeVisible()

    await expect
        .poll(() =>
            page
                .getByTestId('routes-table')
                .getByRole('table')
                .evaluate((table) => {
                    const wrapper = table.parentElement!
                    return wrapper.scrollWidth - wrapper.clientWidth
                }),
        )
        .toBeLessThanOrEqual(1)

    await expect(page.getByTestId('routes-row-edit').first()).toBeVisible()
    const ratings = page.getByTestId('route-details-open').first()
    await expect(ratings).toBeVisible()
    await expect
        .poll(async () => (await ratings.boundingBox())?.width ?? 0)
        .toBeGreaterThan(50)
})
