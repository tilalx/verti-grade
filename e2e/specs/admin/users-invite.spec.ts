import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

async function fillCreateForm(page, email: string, lastname: string) {
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
}) => {
    await gotoSettled(page, '/admin/users')

    const suffix = Date.now()
    const email = `e2e-invited-${suffix}@verti-grade.test`

    await fillCreateForm(page, email, `Invited${suffix}`)

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
}) => {
    await gotoSettled(page, '/admin/users')

    const suffix = Date.now()
    const email = `e2e-invitefail-${suffix}@verti-grade.test`

    await page.route(
        '**/api/collections/users/request-password-reset',
        (route) => route.abort('failed'),
    )

    await fillCreateForm(page, email, `InviteFail${suffix}`)
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
