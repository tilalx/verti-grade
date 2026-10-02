import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { PB_URL } from '../../support/map'
import { authAsSuperuser, ensureUser, getRoleIds } from '../../support/seed'

test('the same user can be edited again after closing with Escape', async ({
    adminPage: page,
    testPrefix,
}) => {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const user = await ensureUser(
        root,
        (await getRoleIds(root)).user!,
        'user',
        `${testPrefix}-reopen`,
    )
    try {
        await gotoSettled(page, '/admin/users')
        await page.getByTestId('filter-search').fill(user.email)
        await expect(page.getByTestId('users-showing')).toContainText(
            'Showing 1 of 1',
        )
        const editButton = page
            .getByTestId(`user-card-${user.id}`)
            .getByTestId('user-card-edit')
        const dialog = page.getByTestId('user-edit-dialog')

        await editButton.click()
        await expect(dialog).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden()

        await editButton.click()
        await expect(dialog).toBeVisible()
    } finally {
        await root.collection('users').delete(user.id)
    }
})
