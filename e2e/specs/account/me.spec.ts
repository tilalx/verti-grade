import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('guests are invited to sign in', async ({ page }) => {
    await gotoSettled(page, '/account')
    await expect(page.getByTestId('me-guest')).toBeVisible()
    await page.getByTestId('me-login').click()
    await page.waitForURL(/\/auth\/login\?redirect=(%2F|\/)account/)
})

test('climbers see their account without staff links', async ({
    userPage: page,
}) => {
    await gotoSettled(page, '/account')
    await expect(page.getByTestId('me-name')).toBeVisible()
    await expect(page.locator('[data-testid^="me-staff-"]')).toHaveCount(0)
    await page.getByTestId('me-profile').click()
    await page.waitForURL(/\/account\/settings$/)
    await expect(page.getByTestId('profile-firstname')).toBeVisible()
})

test('on phones staff get the pages their role allows', async ({
    setterPage: page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoSettled(page, '/account')
    await expect(page.getByTestId('me-staff-manage-routes')).toBeVisible()
    await expect(page.getByTestId('me-staff-manage-map')).toBeVisible()
    await expect(page.getByTestId('me-staff-admin-settings')).toHaveCount(0)
})

test('on desktop the account page leaves staff links to the top navigation', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/account')
    await expect(page.getByTestId('me-name')).toBeVisible()
    await expect(page.getByTestId('me-section-manage')).toBeHidden()
    await expect(page.getByTestId('me-section-admin')).toBeHidden()
    await expect(page.getByTestId('nav-desktop-links')).toBeVisible()
})

test('on phones the account tab links to all public pages', async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoSettled(page, '/account')
    await expect(page.getByTestId('me-page-home')).toBeVisible()
    await page.getByTestId('me-page-routes').click()
    await page.waitForURL(/\/routes$/)
})
