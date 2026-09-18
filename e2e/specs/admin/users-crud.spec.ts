import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('creates and edits a user', async ({ adminPage: page }) => {
    await gotoSettled(page, '/admin/users')

    const suffix = Date.now()
    const email = `e2e-created-${suffix}@verti-grade.test`

    await page.getByTestId('user-create-open').click()
    await expect(page.getByTestId('user-create-dialog')).toBeVisible()
    await page.getByTestId('user-create-firstname').locator('input').fill('E2E')
    await page
        .getByTestId('user-create-lastname')
        .locator('input')
        .fill(`Created${suffix}`)
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
