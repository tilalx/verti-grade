import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

const themeColor = 'meta[name="theme-color"]'

test('the page extends under the iOS safe areas', async ({ page }) => {
    await gotoSettled(page, '/map')
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
        'content',
        /viewport-fit=cover/,
    )
})

test.describe('light theme', () => {
    test.use({ colorScheme: 'light' })

    test('tints the status bar with the light background', async ({ page }) => {
        await gotoSettled(page, '/map')
        await expect(page.locator(themeColor)).toHaveCount(1)
        await expect(page.locator(themeColor)).toHaveAttribute(
            'content',
            /^#F8FAF3$/i,
        )
    })
})

test.describe('dark theme', () => {
    test.use({ colorScheme: 'dark' })

    test('tints the status bar with the dark background', async ({ page }) => {
        await gotoSettled(page, '/map')
        await expect(page.locator(themeColor)).toHaveAttribute(
            'content',
            /^#0d1117$/i,
        )
    })
})
