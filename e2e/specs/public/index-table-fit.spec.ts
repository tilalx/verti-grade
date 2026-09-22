import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test.use({ viewport: { width: 1160, height: 900 } })

test('the route table fits without sideways scrolling', async ({ page }) => {
    await gotoSettled(page, '/')
    await expect(page.getByTestId('index-table')).toBeVisible()

    const overflow = await page
        .locator('.v-table__wrapper')
        .evaluate((el) => el.scrollWidth - el.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
})

test('stacked setter chips keep clear of the row dividers', async ({
    page,
}) => {
    await gotoSettled(page, '/')
    await expect(page.getByTestId('index-table')).toBeVisible()

    const gaps = await page.locator('tbody tr').evaluateAll((rows) => {
        const row = rows.find(
            (tr) => tr.querySelectorAll('.creator-chips .v-chip').length > 1,
        )
        if (!row) return null
        const chips = [...row.querySelectorAll('.creator-chips .v-chip')]
        const rect = row.getBoundingClientRect()
        return {
            top: chips[0].getBoundingClientRect().top - rect.top,
            bottom:
                rect.bottom -
                chips[chips.length - 1].getBoundingClientRect().bottom,
        }
    })

    test.skip(gaps === null, 'no seeded route has two setters')
    expect(gaps!.top).toBeGreaterThanOrEqual(4)
    expect(gaps!.bottom).toBeGreaterThanOrEqual(4)
})
