import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('creates a role with a color, toggles a permission, then deletes it', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/users')
    await expect(page.getByTestId('role-permissions-table')).toBeVisible()

    const name = `e2e-role-${Date.now()}`

    await page.getByTestId('role-create-open').click()
    await expect(page.getByTestId('role-form-dialog')).toBeVisible()
    await page.getByTestId('role-form-name').locator('input').fill(name)
    await page
        .getByTestId('role-form-description')
        .locator('input')
        .fill('created by e2e')
    await page.getByTestId('role-form-swatch-42A5F5').click()
    await page.getByTestId('role-form-submit').click()
    await expect(page.getByTestId('role-form-dialog')).toBeHidden()

    const card = page.getByTestId(`role-permissions-row-${name}`)
    await expect(card).toBeVisible()
    await expect(card).toContainText('created by e2e')

    const avatarBg = await page
        .getByTestId(`role-color-${name}`)
        .evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(avatarBg).toBe('rgb(66, 165, 245)')

    const checkbox = page.getByTestId(`role-permissions-${name}-view_analytics`)
    await expect(checkbox.locator('input')).not.toBeChecked()
    await checkbox.click()
    await expect(checkbox.locator('input')).toBeChecked()

    await gotoSettled(page, '/admin/users')
    await expect(
        page
            .getByTestId(`role-permissions-${name}-view_analytics`)
            .locator('input'),
    ).toBeChecked()

    await page.getByTestId(`role-delete-${name}`).click()
    await expect(page.getByTestId('role-delete-dialog')).toBeVisible()
    await expect(page.getByTestId('role-delete-reassign')).toBeHidden()
    await page.getByTestId('role-delete-confirm').click()

    await expect(page.getByTestId('role-delete-dialog')).toBeHidden()
    await expect(page.getByTestId(`role-permissions-row-${name}`)).toBeHidden()
})

test('moves the holders of a deleted role to the role picked in the dialog', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/users')

    const suffix = Date.now()
    const roleName = `e2e-doomed-${suffix}`
    const email = `e2e-reassign-${suffix}@verti-grade.test`

    await page.getByTestId('role-create-open').click()
    await page.getByTestId('role-form-name').locator('input').fill(roleName)
    await page.getByTestId('role-form-submit').click()
    await expect(page.getByTestId('role-form-dialog')).toBeHidden()
    await expect(
        page.getByTestId(`role-permissions-row-${roleName}`),
    ).toBeVisible()

    await page.getByTestId('user-create-open').click()
    await page.getByTestId('user-create-firstname').locator('input').fill('E2E')
    await page
        .getByTestId('user-create-lastname')
        .locator('input')
        .fill(`Reassign${suffix}`)
    await page.getByTestId('user-create-email').locator('input').fill(email)
    await page.getByTestId('user-create-role').click()
    await page.getByRole('option', { name: roleName, exact: true }).click()
    await page.getByTestId('user-create-submit').click()
    await expect(page.getByTestId('user-create-dialog')).toBeHidden()

    await page.getByTestId(`role-delete-${roleName}`).click()
    await expect(page.getByTestId('role-delete-dialog')).toBeVisible()
    await expect(page.getByTestId('role-delete-holders')).toBeVisible()
    await expect(page.getByTestId('role-delete-reassign')).toBeVisible()
    await page.getByTestId('role-delete-confirm').click()
    await expect(page.getByTestId('role-delete-dialog')).toBeHidden()

    await expect(
        page.getByTestId(`role-permissions-row-${roleName}`),
    ).toBeHidden()

    await page.getByTestId('filter-search').locator('input').fill(email)
    const card = page
        .locator('[data-testid^="user-card-"]')
        .filter({ hasText: email })
    await expect(card).toBeVisible()
    await expect(card.locator('.v-chip')).toHaveText('user')
})

test('the admin role cannot be deleted and its permissions are locked', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/users')

    const adminCard = page.getByTestId('role-permissions-row-admin')
    await expect(adminCard).toBeVisible()
    await expect(page.getByTestId('role-delete-admin')).toHaveCount(0)
    await expect(
        page
            .getByTestId('role-permissions-admin-manage_users')
            .locator('input'),
    ).toBeDisabled()

    await page.getByTestId('role-edit-admin').click()
    await expect(page.getByTestId('role-form-dialog')).toBeVisible()
    await expect(
        page.getByTestId('role-form-name').locator('input'),
    ).not.toBeEditable()
})

test('rejects a role name that is already taken', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/users')

    await page.getByTestId('role-create-open').click()
    await page.getByTestId('role-form-name').locator('input').fill('admin')
    await page.getByTestId('role-form-submit').click()

    await expect(page.getByTestId('role-form-dialog')).toBeVisible()
    await expect(page.getByTestId('role-form-name')).toContainText('already')
})

test('add role button looks like the add user button', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/users')
    const style = (testId: string) =>
        page.getByTestId(testId).evaluate((button) => {
            const computed = getComputedStyle(button)
            return {
                height: button.getBoundingClientRect().height,
                background: computed.backgroundColor,
                color: computed.color,
                fontSize: computed.fontSize,
            }
        })

    expect(await style('role-create-open')).toEqual(
        await style('user-create-open'),
    )
})
