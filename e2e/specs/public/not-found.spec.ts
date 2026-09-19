import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('shows the 404 page for an unknown route', async ({ page }) => {
    await gotoSettled(page, '/this-page-does-not-exist')
    await expect(page.getByText('404')).toBeVisible()
})
