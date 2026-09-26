import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('shows the 404 page for an unknown route', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')
    expect(response?.status()).toBe(404)
    await gotoSettled(page, '/this-page-does-not-exist')
    await expect(page.getByTestId('error-status')).toContainText('404')
})

test('back to home clears the error', async ({ page }) => {
    await gotoSettled(page, '/this-page-does-not-exist')
    await page.getByTestId('error-home').click()
    await page.waitForURL((url) => url.pathname === '/')
    await expect(page.getByTestId('error-page')).toHaveCount(0)
})

test('go back returns to the previous page', async ({ page }) => {
    await gotoSettled(page, '/imprint')
    await gotoSettled(page, '/this-page-does-not-exist')
    await page.getByTestId('error-back').click()
    await page.waitForURL((url) => url.pathname === '/imprint')
    await expect(page.getByTestId('error-page')).toHaveCount(0)
})
