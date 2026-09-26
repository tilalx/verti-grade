import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('stacks snackbars instead of replacing them', async ({ page }) => {
    await gotoSettled(page, '/auth/login')
    await page
        .getByTestId('login-identity')
        .locator('input')
        .fill('e2e-admin@verti-grade.test')
    await page
        .getByTestId('login-password')
        .locator('input')
        .fill('wrong-password')

    const submit = page.getByTestId('login-submit')
    const messages = page.getByTestId('global-snackbar-message')
    await submit.click()
    await expect(messages).toHaveCount(1)
    await submit.click()
    await expect(messages).toHaveCount(2)
})

test('announces the number of routes found after searching', async ({
    page,
}) => {
    await gotoSettled(page, '/')
    await page
        .getByTestId('filter-search')
        .locator('input')
        .fill('no-such-route-e2e-xyz')
    await expect(page.locator('.nuxt-announcer')).toHaveText(/:\s*0$/)
})

test('shows a visible focus ring for keyboard focus', async ({ page }) => {
    await gotoSettled(page, '/')
    await page.keyboard.press('Tab')
    const outline = await page.evaluate(
        () => getComputedStyle(document.activeElement!).outlineStyle,
    )
    expect(outline).toBe('solid')
})

test('renders the navigation loading indicator', async ({ page }) => {
    await gotoSettled(page, '/')
    await expect(page.locator('.nuxt-loading-indicator')).toBeAttached()
})

test('keeps the focus ring off text inputs', async ({ page }) => {
    await gotoSettled(page, '/')
    const search = page.getByTestId('filter-search').locator('input')
    await search.focus()
    await expect(search).toHaveCSS('outline-style', 'none')
})
