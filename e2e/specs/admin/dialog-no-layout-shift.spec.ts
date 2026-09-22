import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('the route form sheet sits flush and shifts nothing behind it', async ({
    adminPage: page,
}) => {
    await page.setViewportSize({ width: 393, height: 852 })
    await gotoSettled(page, '/manage/routes')

    const scrollable = await page.evaluate(
        () =>
            document.documentElement.scrollHeight >
            document.documentElement.clientHeight,
    )
    expect(scrollable, 'the list must scroll for this to be a real test').toBe(
        true,
    )

    const anchors = async () => ({
        burger: (await page.getByTestId('nav-hamburger').boundingBox())!,
        search: (await page.getByTestId('filter-search').boundingBox())!,
    })

    const before = await anchors()
    await page.getByTestId('routes-create-open').click()
    await expect(page.getByTestId('route-form-dialog')).toBeVisible()
    const during = await anchors()

    expect(during.burger.x).toBeCloseTo(before.burger.x, 0)
    expect(during.search.x).toBeCloseTo(before.search.x, 0)
    expect(during.search.width).toBeCloseTo(before.search.width, 0)

    const sheet = (await page.locator('.dialog-shell--sheet').boundingBox())!
    expect(sheet.x).toBe(0)
    expect(sheet.width).toBe(393)
})
