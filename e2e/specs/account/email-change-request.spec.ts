import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

async function openProfileDialog(page) {
    await gotoSettled(page, '/')
    await page.getByTestId('user-menu-activator').click()
    await page.getByTestId('user-menu-profile').click()
    await expect(page.getByTestId('profile-dialog')).toBeVisible()
    await expect(page.getByTestId('profile-email')).toBeVisible()
}

test('requests an email change instead of writing the address', async ({
    userPage: page,
}) => {
    await openProfileDialog(page)

    const newEmail = `e2e-newaddr-${Date.now()}@verti-grade.test`
    await page.getByTestId('profile-email').locator('input').fill(newEmail)

    const changeRequest = page.waitForRequest((req) =>
        req.url().includes('/api/collections/users/request-email-change'),
    )
    const patch = page.waitForRequest(
        (req) =>
            req.method() === 'PATCH' &&
            req.url().includes('/api/collections/users/records/'),
    )

    await page.getByTestId('profile-save').click()

    const patchReq = await patch
    expect(await patchReq.postData()).not.toContain(newEmail)

    const req = await changeRequest
    expect(req.postDataJSON()?.newEmail).toBe(newEmail)
})

test('reports a failed confirmation mail without claiming the change', async ({
    userPage: page,
}) => {
    await page.route('**/api/collections/users/request-email-change', (route) =>
        route.abort('failed'),
    )

    await openProfileDialog(page)
    await page
        .getByTestId('profile-email')
        .locator('input')
        .fill(`e2e-failaddr-${Date.now()}@verti-grade.test`)
    await page.getByTestId('profile-save').click()

    await expect(page.getByTestId('global-snackbar')).toBeVisible()
})

test('blocks saving a malformed email address', async ({ userPage: page }) => {
    await openProfileDialog(page)
    await page
        .getByTestId('profile-email')
        .locator('input')
        .fill('not-an-email')
    await page.getByTestId('profile-save').click()

    await expect(page.getByTestId('profile-email')).toBeVisible()
})
