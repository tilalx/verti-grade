import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

// Both tests write the one singleton settings record, so they must not run at
// the same time — in parallel each clobbers the value the other just saved.
test.describe.configure({ mode: 'serial' })

test('updates organization settings', async ({ adminPage: page }) => {
    await gotoSettled(page, '/admin/settings')

    const value = `E2E Org ${Date.now()}`
    await page.getByTestId('settings-org-name').locator('input').fill(value)
    await page.getByTestId('settings-save').click()
    await expect(page.getByTestId('settings-save')).toBeHidden()

    await gotoSettled(page, '/admin/settings')
    await expect(
        page.getByTestId('settings-org-name').locator('input'),
    ).toHaveValue(value)
})

test('shows an error and keeps the form open when save fails', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/settings')

    // Own the baseline. The seeded settings record is created with no fields,
    // so the organisation name starts empty: waiting for "not empty" only ever
    // passed when a sibling test happened to have saved one first.
    const orgName = page.getByTestId('settings-org-name').locator('input')
    const original = `E2E Baseline ${Date.now()}`
    await orgName.fill(original)
    await page.getByTestId('settings-save').click()
    await expect(page.getByTestId('settings-save')).toBeHidden()

    await page.route('**/api/collections/settings/records/**', (route) =>
        route.abort('failed'),
    )

    await page
        .getByTestId('settings-org-name')
        .locator('input')
        .fill(`E2E Fail ${Date.now()}`)
    await page.getByTestId('settings-save').click()

    await expect(page.getByTestId('global-snackbar')).toBeVisible()
    await expect(page.getByTestId('settings-save')).toBeVisible()

    await page.unroute('**/api/collections/settings/records/**')
    await gotoSettled(page, '/admin/settings')
    await expect(
        page.getByTestId('settings-org-name').locator('input'),
    ).toHaveValue(original)
})
