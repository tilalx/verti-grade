import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('opens the mobile nav drawer and navigates', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/routes')
    await page.getByTestId('nav-hamburger').click()
    await expect(page.getByTestId('nav-drawer')).toBeVisible()
    await page.getByTestId('nav-drawer-link-admin-comments').click()
    await page.waitForURL('**/admin/comments')
})
