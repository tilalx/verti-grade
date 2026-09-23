import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { authAsSuperuser, ensureUser, getRoleIds } from '../../support/seed'
import { SUPPORTED_LOCALES } from '../../../app/utils/locales'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'

test('every supported locale is offered in the profile and accepted by the users collection', async ({
    page,
    testPrefix,
}) => {
    const pb = new PocketBase(PB_URL)
    await authAsSuperuser(pb)
    const roleIds = await getRoleIds(pb)
    const user = await ensureUser(
        pb,
        roleIds.user,
        'user',
        `${testPrefix}locales`,
    )

    for (const { code } of SUPPORTED_LOCALES) {
        const updated = await pb
            .collection('users')
            .update(user.id, { language: code })
        expect(updated.language).toBe(code)
    }

    await gotoSettled(page, '/auth/login')
    await page.getByTestId('login-identity').locator('input').fill(user.email)
    await page
        .getByTestId('login-password')
        .locator('input')
        .fill(user.password)
    await page.getByTestId('login-submit').click()
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'))

    await page.getByTestId('user-menu-activator').click()
    await page.getByTestId('user-menu-profile').click()
    await page.getByTestId('profile-language').click()
    await expect(
        page.locator('[data-testid^="profile-language-"]'),
    ).toHaveCount(SUPPORTED_LOCALES.length)
    for (const { code, name } of SUPPORTED_LOCALES) {
        await expect(
            page.getByTestId(`profile-language-${code}`),
        ).toContainText(name)
    }

    await pb.collection('users').delete(user.id)
})
