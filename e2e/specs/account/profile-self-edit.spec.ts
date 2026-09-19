import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test.describe('self-service profile', () => {
    test('edits own name and sees it reflected after save', async ({
        userPage: page,
        testPrefix,
    }) => {
        await gotoSettled(page, '/')
        await page.getByTestId('user-menu-activator').click()
        await page.getByTestId('user-menu-profile').click()
        await expect(page.getByTestId('profile-dialog')).toBeVisible()

        const newLastname = `${testPrefix}-lastname`
        await page
            .getByTestId('profile-lastname')
            .locator('input')
            .fill(newLastname)
        await page.getByTestId('profile-save').click()

        await expect(page.getByTestId('global-snackbar-message')).toBeVisible()
        await expect(page.getByTestId('profile-dialog')).toBeHidden()

        // Reopen to confirm the change was persisted, not just local state.
        await page.getByTestId('user-menu-activator').click()
        await page.getByTestId('user-menu-profile').click()
        await expect(
            page.getByTestId('profile-lastname').locator('input'),
        ).toHaveValue(newLastname)
    })

    test('rejects a password change with the wrong current password', async ({
        userPage: page,
    }) => {
        await gotoSettled(page, '/')
        await page.getByTestId('user-menu-activator').click()
        await page.getByTestId('user-menu-profile').click()
        await page.getByTestId('profile-tab-security').click()

        await page
            .getByTestId('password-old')
            .locator('input')
            .fill('definitely-wrong')
        await page
            .getByTestId('password-new')
            .locator('input')
            .fill('NewPassw0rd!234')
        await page
            .getByTestId('password-confirm')
            .locator('input')
            .fill('NewPassw0rd!234')

        await page.getByTestId('profile-save').click()

        await expect(page.getByTestId('global-snackbar-message')).toContainText(
            /incorrect/i,
        )
        // Dialog stays open on failure — nothing was saved.
        await expect(page.getByTestId('profile-dialog')).toBeVisible()
    })

    test('shows an error and keeps the dialog open when save fails outright', async ({
        userPage: page,
        testPrefix,
    }) => {
        await gotoSettled(page, '/')
        await page.getByTestId('user-menu-activator').click()
        await page.getByTestId('user-menu-profile').click()
        await expect(page.getByTestId('profile-dialog')).toBeVisible()

        await page.route('**/api/collections/users/records/**', (route) =>
            route.abort('failed'),
        )

        await page
            .getByTestId('profile-lastname')
            .locator('input')
            .fill(`${testPrefix}-fail`)
        await page.getByTestId('profile-save').click()

        await expect(page.getByTestId('global-snackbar-message')).toBeVisible()
        await expect(page.getByTestId('profile-dialog')).toBeVisible()
    })

    test('cancel discards unsaved changes', async ({ userPage: page }) => {
        await gotoSettled(page, '/')
        await page.getByTestId('user-menu-activator').click()
        await page.getByTestId('user-menu-profile').click()

        const original = await page
            .getByTestId('profile-lastname')
            .locator('input')
            .inputValue()
        await page
            .getByTestId('profile-lastname')
            .locator('input')
            .fill('should-not-persist')
        await page.getByTestId('profile-cancel').click()
        await expect(page.getByTestId('profile-dialog')).toBeHidden()

        await page.getByTestId('user-menu-activator').click()
        await page.getByTestId('user-menu-profile').click()
        await expect(
            page.getByTestId('profile-lastname').locator('input'),
        ).toHaveValue(original)
    })
})
