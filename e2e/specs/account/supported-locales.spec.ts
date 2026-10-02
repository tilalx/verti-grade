import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { SUPPORTED_LOCALES } from '../../../app/utils/locales'

test('every supported locale is offered in the profile and accepted by the users collection', async ({
    root,
    createUser,
    pageAs,
}) => {
    const user = await createUser()

    for (const { code } of SUPPORTED_LOCALES) {
        const updated = await root
            .collection('users')
            .update(user.id, { language: code })
        expect(updated.language).toBe(code)
    }

    await root.collection('users').update(user.id, { language: 'en' })
    const page = await pageAs(user)
    await gotoSettled(page, '/account/settings?tab=preferences')
    await page.getByTestId('profile-language').click()
    await expect(
        page.locator('[data-testid^="profile-language-"]'),
    ).toHaveCount(SUPPORTED_LOCALES.length)
    for (const { code, name } of SUPPORTED_LOCALES) {
        await expect(
            page.getByTestId(`profile-language-${code}`),
        ).toContainText(name)
    }
})
