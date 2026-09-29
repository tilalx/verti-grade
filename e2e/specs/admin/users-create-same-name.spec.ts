import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { PB_URL } from '../../support/map'
import { authAsSuperuser } from '../../support/seed'

test('two people with the same short name can both be created', async ({
    adminPage: page,
    testPrefix,
}) => {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const emails = [1, 2].map(
        (index) => `${testPrefix}-same-${index}@gripello.test`,
    )
    try {
        await gotoSettled(page, '/admin/users')
        for (const email of emails) {
            await page.getByTestId('user-create-open').click()
            await page
                .getByTestId('user-create-firstname')
                .locator('input')
                .fill('Q')
            await page
                .getByTestId('user-create-lastname')
                .locator('input')
                .fill('Z')
            await page
                .getByTestId('user-create-email')
                .locator('input')
                .fill(email)
            await page.getByTestId('user-create-submit').click()
            await expect(page.getByTestId('user-create-dialog')).toBeHidden()
        }

        for (const email of emails) {
            const created = await root
                .collection('users')
                .getFirstListItem(root.filter('email = {:email}', { email }))
            expect(created.username).toMatch(/^qz\d{6}$/)
        }
    } finally {
        for (const email of emails) {
            const created = await root
                .collection('users')
                .getFirstListItem(root.filter('email = {:email}', { email }))
                .catch(() => null)
            if (created) await root.collection('users').delete(created.id)
        }
    }
})
