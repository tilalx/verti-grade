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
        await gotoSettled(page, '/account/settings?tab=security')
        await page.route(
            '**/api/collections/users/auth-with-password',
            (route) => route.abort(),
        )

        await page.getByTestId('password-old').fill(user.password)
        await page.getByTestId('password-new').fill(NEW_PASSWORD)
        await page.getByTestId('password-confirm').fill(NEW_PASSWORD)
        await page.getByTestId('profile-save').click()

        await expect(page).toHaveURL(/\/auth\/login/)
        await expect(page.getByTestId('settings-page')).toHaveCount(0)
        await expect(page.getByTestId('global-snackbar-message')).toContainText(
            'Password changed. Please sign in again',
        )
    } finally {
        await root
            .collection('users')
            .delete(user.id)
            .catch(() => {})
    }
})
