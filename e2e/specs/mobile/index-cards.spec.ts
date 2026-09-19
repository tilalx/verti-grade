import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('shows the route list as cards on mobile', async ({ page }) => {
    await gotoSettled(page, '/')
    await expect(
        page.locator('.route-card[data-testid^="route-card-"]').first(),
    ).toBeVisible()
    await expect(page.getByTestId('index-table')).toHaveCount(0)
})
