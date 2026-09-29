import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('creates and edits a user', async ({ adminPage: page, testPrefix }) => {
    await gotoSettled(page, '/admin/users')

    const email = `${testPrefix}-created@gripello.test`

    await page.getByTestId('user-create-open').click()
    await expect(page.getByTestId('user-create-dialog')).toBeVisible()
    await page.getByTestId('user-create-firstname').locator('input').fill('E2E')
    await page
        .getByTestId('user-create-lastname')
        .locator('input')
        .fill('Created')
    await page.getByTestId('user-create-email').locator('input').fill(email)
    await page.getByTestId('user-create-submit').click()
    await expect(page.getByTestId('user-create-dialog')).toBeHidden()

    await page.getByTestId('filter-search').locator('input').fill(email)
    const card = page
        .locator(`[data-testid^="user-card-"]`)
        .filter({ hasText: email })
    await expect(card).toBeVisible()

    await card.getByTestId('user-card-edit').click()
    await expect(page.getByTestId('user-edit-dialog')).toBeVisible()
    await page
        .getByTestId('user-edit-firstname')
        .locator('input')
        .fill('E2EEdited')
    await page.getByTestId('user-edit-submit').click()
    await expect(page.getByTestId('user-edit-dialog')).toBeHidden()
})

test('rejects creating a user with a duplicate email', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/users')

    await page.getByTestId('user-create-open').click()
    await expect(page.getByTestId('user-create-dialog')).toBeVisible()
    await page.getByTestId('user-create-firstname').locator('input').fill('E2E')
    await page
        .getByTestId('user-create-lastname')
        .locator('input')
        .fill('Duplicate')
    await page
        .getByTestId('user-create-email')
        .locator('input')
        .fill('e2e-admin@gripello.test')
    await page.getByTestId('user-create-submit').click()

    await expect(page.getByTestId('global-snackbar')).toBeVisible()
    await expect(page.getByTestId('user-create-dialog')).toBeVisible()
})

test('blocks submit when required fields are empty', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/users')

    await page.getByTestId('user-create-open').click()
    await expect(page.getByTestId('user-create-dialog')).toBeVisible()

    await expect(page.getByTestId('user-create-submit')).toBeDisabled()
    await expect(page.getByTestId('user-create-dialog')).toBeVisible()
})
