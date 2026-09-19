import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('shows a mobile-only notice on desktop', async ({ adminPage: page }) => {
    await gotoSettled(page, '/admin/inventory')
    await expect(
        page.getByText(/only available on mobile devices/i),
    ).toBeVisible()
})
