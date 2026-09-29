import type { Page } from '@playwright/test'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { createRole } from '../../support/seed'

const roleSaved = (page: Page) =>
    page.waitForResponse(
        (res) =>
            res.request().method() === 'PATCH' &&
            res.url().includes('/api/collections/roles/records/'),
    )

test('toggles a permission for a role', async ({
    adminPage: page,
    root,
    testPrefix,
}) => {
    const role = await createRole(root, `${testPrefix}-role`)
    await gotoSettled(page, '/admin/users')

    const checkbox = page.getByTestId(
        `role-permissions-${role.name}-manage_users`,
    )
    await expect(checkbox.locator('input')).not.toBeChecked()

    const saved = roleSaved(page)
    await checkbox.click()
    expect((await saved).ok()).toBe(true)
    await expect(checkbox.locator('input')).toBeChecked()

    await gotoSettled(page, '/admin/users')
    await expect(checkbox.locator('input')).toBeChecked()

    const reverted = roleSaved(page)
    await checkbox.click()
    expect((await reverted).ok()).toBe(true)
    await expect(checkbox.locator('input')).not.toBeChecked()
})

test('shows an error and does not persist the change when the update fails', async ({
    adminPage: page,
    root,
    testPrefix,
}) => {
    const role = await createRole(root, `${testPrefix}-role`)
    await gotoSettled(page, '/admin/users')

    const checkbox = page.getByTestId(
        `role-permissions-${role.name}-manage_settings`,
    )
    await expect(checkbox.locator('input')).not.toBeChecked()

    await page.route('**/api/collections/roles/records/**', (route) =>
        route.abort('failed'),
    )

    await checkbox.click()
    await expect(page.getByTestId('global-snackbar')).toBeVisible()
    await expect(checkbox.locator('input')).not.toBeChecked()

    await page.unroute('**/api/collections/roles/records/**')
    await gotoSettled(page, '/admin/users')
    await expect(checkbox.locator('input')).not.toBeChecked()
})
