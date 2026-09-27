import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

for (const path of ['/manage/routes', '/map', '/scan', '/account']) {
    test(`${path} fits the phone width`, async ({ adminPage: page }) => {
        await gotoSettled(page, path)
        const overflow = await page.evaluate(
            () =>
                document.documentElement.scrollWidth -
                document.documentElement.clientWidth,
        )
        expect(overflow).toBeLessThanOrEqual(1)
    })
}
