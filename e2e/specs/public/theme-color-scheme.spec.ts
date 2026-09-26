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

test.describe('theme toggle', () => {
    test.use({ colorScheme: 'light' })

    test('cycles system → light → dark and persists across reload', async ({
        page,
    }) => {
        await gotoSettled(page, '/')
        const toggle = page.getByTestId('nav-theme-toggle')
        await expect(toggle).toHaveAttribute('data-theme-mode', 'system')

        await toggle.click()
        await expect(toggle).toHaveAttribute('data-theme-mode', 'light')
        await expect(page.locator(appRoot)).toHaveClass(/v-theme--light/)

        await toggle.click()
        await expect(toggle).toHaveAttribute('data-theme-mode', 'dark')
        await expect(page.locator(appRoot)).toHaveClass(/v-theme--dark/)

        await gotoSettled(page, '/')
        await expect(page.locator(appRoot)).toHaveClass(/v-theme--dark/)
    })

    test('explicit choice overrides the OS preference', async ({
        page,
        baseURL,
    }) => {
        await page
            .context()
            .addCookies([{ name: 'theme-mode', value: 'dark', url: baseURL! }])
        await gotoSettled(page, '/')
        await expect(page.locator(appRoot)).toHaveClass(/v-theme--dark/)
    })
})
