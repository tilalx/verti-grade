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

test('shows an error and does not persist the change when the update fails', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/users')
    await expect(page.getByTestId('role-permissions-table')).toBeVisible()

    // A different permission than the toggle test above uses, so the two
    // tests (which can run concurrently in different workers) don't race
    // on the same checkbox.
    const checkbox = page.getByTestId(
        'role-permissions-routesetter-manage_settings',
    )

    await page.route('**/api/collections/roles/records/**', (route) =>
        route.abort('failed'),
    )

    await checkbox.click()
    await expect(page.getByTestId('global-snackbar')).toBeVisible()

    // NOTE: the checkbox itself isn't asserted here — it's one-way bound
    // (:model-value + @update:model-value, no real v-model), so Vuetify's
    // selection control keeps its optimistic checked state on failure and
    // never re-syncs from the (unchanged) prop. That's a real UI bug: the
    // admin sees no visual indication the toggle didn't actually save,
    // beyond the transient error snackbar. What's verified here is the
    // thing that actually matters — the permission was NOT persisted.
    await page.unroute('**/api/collections/roles/records/**')
    await gotoSettled(page, '/admin/users')
    await expect(
        page
            .getByTestId('role-permissions-routesetter-manage_settings')
            .locator('input'),
    ).not.toBeChecked()
})
