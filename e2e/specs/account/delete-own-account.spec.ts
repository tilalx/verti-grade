import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('lets a user delete their own account', async ({
    root,
    createUser,
    pageAs,
}) => {
    const user = await createUser()
    const page = await pageAs(user)
    await gotoSettled(page, '/')

    await page.getByTestId('user-menu-activator').click()
    await page.getByTestId('user-menu-profile').click()
    await expect(page.getByTestId('profile-dialog')).toBeVisible()

    await page.getByTestId('profile-tab-security').click()
    await page.getByTestId('profile-delete-open').click()
    await expect(page.getByTestId('confirm-dialog')).toBeVisible()
    await page.getByTestId('confirm-dialog-confirm').click()

    await page.waitForURL(/\/auth\/login/)

    await expect(root.collection('users').getOne(user.id)).rejects.toThrow()
})
