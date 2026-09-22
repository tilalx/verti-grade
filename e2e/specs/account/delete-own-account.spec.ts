import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import PocketBase from 'pocketbase'
import { authAsSuperuser, getRoleIds } from '../../support/seed'

/**
 * 1774100001 blocked self-deletion outright; 1790017200 allows it so the
 * account owner can close their own account. Uses a throwaway account — the
 * shared fixtures are reused by every other spec.
 */

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'
const PASSWORD = 'E2ePassw0rd!'

async function createDisposableUser(prefix: string) {
    const pb = new PocketBase(PB_URL)
    await authAsSuperuser(pb)
    const roleIds = await getRoleIds(pb)
    const email = `${prefix}-selfdelete@verti-grade.test`
    const record = await pb.collection('users').create({
        email,
        emailVisibility: true,
        password: PASSWORD,
        passwordConfirm: PASSWORD,
        verified: true,
        username: `${prefix}selfdelete`.replace(/[^a-z0-9]/g, ''),
        firstname: 'E2E',
        name: 'SelfDelete',
        role: roleIds.user,
    })
    return { pb, email, id: record.id }
}

test('lets a user delete their own account', async ({ page, testPrefix }) => {
    const { pb, email, id } = await createDisposableUser(testPrefix)

    await gotoSettled(page, '/auth/login')
    await page.getByTestId('login-identity').locator('input').fill(email)
    await page.getByTestId('login-password').locator('input').fill(PASSWORD)
    await page.getByTestId('login-submit').click()
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'))

    await page.getByTestId('user-menu-activator').click()
    await page.getByTestId('user-menu-profile').click()
    await expect(page.getByTestId('profile-dialog')).toBeVisible()

    await page.getByTestId('profile-tab-security').click()
    await page.getByTestId('profile-delete-open').click()
    await expect(page.getByTestId('confirm-dialog')).toBeVisible()
    await page.getByTestId('confirm-dialog-confirm').click()

    // Signed out and bounced back to login.
    await page.waitForURL(/\/auth\/login/)

    // And genuinely gone from PocketBase, not just logged out client-side.
    await expect(
        pb.collection('users').getOne(id, { requestKey: null }),
    ).rejects.toThrow()
})
