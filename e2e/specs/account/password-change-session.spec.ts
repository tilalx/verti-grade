import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { signInAs } from '../../support/auth'
import { authAsSuperuser, ensureUser, getRoleIds } from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'
const NEW_PASSWORD = 'Chang3dPassw0rd!'

test('stays signed in after changing the own password', async ({
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
        `${testPrefix}-pw`,
    )

    try {
        await signInAs(page, user.email, user.password)
        await gotoSettled(page, '/')
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
        await expect(page.getByTestId('profile-dialog')).toBeHidden()

        await gotoSettled(page, '/account')
        await expect(page.getByTestId('me-guest')).toHaveCount(0)
        await page.getByTestId('user-menu-activator').click()
        await expect(page.getByTestId('user-menu-profile')).toBeVisible()
    } finally {
        await root
            .collection('users')
            .delete(user.id)
            .catch(() => {})
    }
})
