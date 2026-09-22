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

    await checkbox.click()
    await expect(checkbox.locator('input')).toHaveJSProperty(
        'checked',
        wasChecked,
    )
})

test('shows an error and does not persist the change when the update fails', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/users')
    await expect(page.getByTestId('role-permissions-table')).toBeVisible()

    const checkbox = page.getByTestId(
        'role-permissions-routesetter-manage_settings',
    )

    await page.route('**/api/collections/roles/records/**', (route) =>
        route.abort('failed'),
    )

    await checkbox.click()
    await expect(page.getByTestId('global-snackbar')).toBeVisible()
    await expect(checkbox.locator('input')).not.toBeChecked()

    await page.unroute('**/api/collections/roles/records/**')
    await gotoSettled(page, '/admin/users')
    await expect(
        page
            .getByTestId('role-permissions-routesetter-manage_settings')
            .locator('input'),
    ).not.toBeChecked()
})
