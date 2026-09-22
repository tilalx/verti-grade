import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

const appRoot = '.v-application'

test.describe('dark OS preference', () => {
    test.use({ colorScheme: 'dark' })

    test('applies the dark theme on first load', async ({ page }) => {
        await gotoSettled(page, '/')
        await expect(page.locator(appRoot)).toHaveClass(/v-theme--dark/)
    })

    test('ignores a stale light color-scheme cookie', async ({
        page,
        baseURL,
    }) => {
        await page.context().addCookies([
            {
                name: 'color-scheme',
                value: 'light',
                url: baseURL!,
            },
        ])
        await gotoSettled(page, '/')
        await expect(page.locator(appRoot)).toHaveClass(/v-theme--dark/)
    })
})

test.describe('light OS preference', () => {
    test.use({ colorScheme: 'light' })

    test('applies the light theme on first load', async ({ page }) => {
        await gotoSettled(page, '/')
        await expect(page.locator(appRoot)).toHaveClass(/v-theme--light/)
    })
})
