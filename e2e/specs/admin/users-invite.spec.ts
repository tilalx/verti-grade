import type { Page } from '@playwright/test'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

async function fillCreateForm(page: Page, email: string, lastname: string) {
    await page.getByTestId('user-create-open').click()
    await expect(page.getByTestId('user-create-dialog')).toBeVisible()
    await page.getByTestId('user-create-firstname').locator('input').fill('E2E')
    await page
        .getByTestId('user-create-lastname')
        .locator('input')
        .fill(lastname)
    await page.getByTestId('user-create-email').locator('input').fill(email)
}

test('sends an invite mail after creating a user', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/admin/users')

    const email = `${testPrefix}-invited@gripello.test`

    await fillCreateForm(page, email, 'Invited')

    const resetRequest = page.waitForRequest((req) =>
        req.url().includes('/api/collections/users/request-password-reset'),
    )
    await page.getByTestId('user-create-submit').click()

    const req = await resetRequest
    expect(req.postDataJSON()?.email).toBe(email)
    await expect(page.getByTestId('user-create-dialog')).toBeHidden()
})

test('keeps the created user when the invite mail fails', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/admin/users')

    const email = `${testPrefix}-invitefail@gripello.test`

    await page.route(
        '**/api/collections/users/request-password-reset',
        (route) => route.abort('failed'),
    )

    await fillCreateForm(page, email, 'InviteFail')
    await page.getByTestId('user-create-submit').click()

    await expect(page.getByTestId('global-snackbar')).toBeVisible()
    await expect(page.getByTestId('user-create-dialog')).toBeHidden()

    await page.getByTestId('filter-search').locator('input').fill(email)
    await expect(
        page.locator('[data-testid^="user-card-"]').filter({ hasText: email }),
    ).toBeVisible()
})

test('shows no mail warning in the create dialog once SMTP is configured', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/users')
    await page.getByTestId('user-create-open').click()

    await expect(page.getByTestId('user-create-dialog')).toBeVisible()
    await expect(page.getByTestId('user-create-mail-warning')).toBeHidden()
})
