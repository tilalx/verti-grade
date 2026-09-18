import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('nav has a labelled main-navigation landmark', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/routes')
    // The page legitimately has several labelled nav landmarks (desktop
    // links, the off-canvas mobile drawer, Vuetify's pagination control) —
    // assert the visible main-navigation one specifically.
    await expect(
        page.getByRole('navigation', { name: 'Main navigation' }).first(),
    ).toBeVisible()
})

test('dialogs expose a role and are keyboard-dismissible', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/routes')
    await page.getByTestId('routes-create-open').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('route-form-dialog')).toBeHidden()
})

test('icon-only close buttons have an accessible name', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/routes')
    await page.getByTestId('route-details-open').first().click()
    await expect(page.getByRole('button', { name: /close/i })).toBeVisible()
})
