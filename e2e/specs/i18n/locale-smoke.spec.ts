import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { projectLanguage, translate } from '../../support/i18n'

test('login page renders in the browser Accept-Language locale', async ({
    page,
}, testInfo) => {
    await gotoSettled(page, '/auth/login')
    await expect(page.getByTestId('login-form')).toBeVisible()
    await expect(page).toHaveURL(/\/auth\/login$/)
    await expect(page.getByTestId('login-submit')).toHaveText(
        translate(projectLanguage(testInfo), 'account.login'),
    )
})

test('public route list renders in the browser Accept-Language locale', async ({
    page,
}, testInfo) => {
    await gotoSettled(page, '/routes')
    await expect(
        page.getByRole('columnheader', {
            name: translate(projectLanguage(testInfo), 'routes.screwed_at'),
        }),
    ).toBeVisible()
})
