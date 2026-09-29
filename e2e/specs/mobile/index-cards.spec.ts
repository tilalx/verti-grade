import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('shows the route list as cards on mobile', async ({ page }) => {
    await gotoSettled(page, '/routes')
    await expect(
        page.getByTestId(/^route-card-[a-z0-9]{15}$/).first(),
    ).toBeVisible()
    await expect(page.getByTestId('index-table')).toHaveCount(0)
})
