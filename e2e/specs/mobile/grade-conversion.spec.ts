import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('conversion table opens compact on phones and columns can be added', async ({
    page,
}) => {
    await gotoSettled(page, '/')
    await page.getByTestId('index-grade-conversion-open').click()

    const dialog = page.getByTestId('grade-conversion-dialog')
    await expect(
        dialog.getByTestId('grade-conversion-column-french'),
    ).toBeVisible()
    await expect(
        dialog.getByTestId('grade-conversion-column-ewbank'),
    ).toHaveCount(0)

    const overflow = await dialog
        .locator('.grade-conversion')
        .evaluate((el) => el.scrollWidth - el.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)

    await dialog.getByTestId('grade-conversion-toggle-ewbank').click()
    await expect(dialog.getByTestId('grade-conversion-ewbank-23')).toBeVisible()
})
