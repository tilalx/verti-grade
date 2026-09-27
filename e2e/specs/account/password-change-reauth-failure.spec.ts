import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { signInAs } from '../../support/auth'
import { authAsSuperuser, ensureUser, getRoleIds } from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'
const NEW_PASSWORD = 'Chang3dPassw0rd!'

test('asks to sign in again when re-authentication fails after a password change', async ({
    page,
    testPrefix,
}) => {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const roleIds = await getRoleIds(root)
    const user = await ensureUser(
        root,
        roleIds.user,
        'user',
        `${testPrefix}-pw-reauth`,
    )

    try {
        await signInAs(page, user.email, user.password)
        await gotoSettled(page, '/')
        await page.route(
            '**/api/collections/users/auth-with-password',
            (route) => route.abort(),
        )
        await page.getByTestId('user-menu-activator').click()
        await page.getByTestId('user-menu-profile').click()
        await page.getByTestId('profile-tab-security').click()

        await page
            .getByTestId('password-old')
            .locator('input')
            .fill(user.password)
        await page
            .getByTestId('password-new')
            .locator('input')
            .fill(NEW_PASSWORD)
        await page
            .getByTestId('password-confirm')
            .locator('input')
            .fill(NEW_PASSWORD)
        await page.getByTestId('profile-save').click()

        await expect(page).toHaveURL(/\/auth\/login/)
        await expect(page.getByTestId('profile-dialog')).toBeHidden()
        await expect(
            page.getByText('Password changed. Please sign in again'),
        ).toBeVisible()
    } finally {
        await root
            .collection('users')
            .delete(user.id)
            .catch(() => {})
    }
})
