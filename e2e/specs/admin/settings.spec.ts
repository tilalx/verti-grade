import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('updates organization settings', async ({ adminPage: page }) => {
    await gotoSettled(page, '/admin/settings')

    const value = `E2E Org ${Date.now()}`
    await page.getByTestId('settings-org-name').locator('input').fill(value)
    await page.getByTestId('settings-save').click()
    await expect(page.getByTestId('settings-save')).toBeHidden()

    await gotoSettled(page, '/admin/settings')
    await expect(
        page.getByTestId('settings-org-name').locator('input'),
    ).toHaveValue(value)
})
