import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('toggles a permission for the routesetter role', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/users')
    await expect(page.getByTestId('role-permissions-table')).toBeVisible()

    const checkbox = page.getByTestId(
        'role-permissions-routesetter-manage_users',
    )
    const wasChecked = await checkbox.locator('input').isChecked()
    await checkbox.click()
    await expect(page.getByTestId('role-permissions-table')).toBeVisible()

    // Toggle back to leave state clean for other tests/workers.
    await checkbox.click()
    await expect(checkbox.locator('input')).toHaveJSProperty(
        'checked',
        wasChecked,
    )
})
