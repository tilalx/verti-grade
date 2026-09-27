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

test.describe('browser bars', () => {
    test.use({ colorScheme: 'light' })

    for (const path of ['/', '/routes', '/map', '/imprint']) {
        test(`${path} pairs the bars with the light and dark app bar`, async ({
            page,
        }) => {
            await page.setViewportSize({ width: 1440, height: 900 })
            await gotoSettled(page, path)
            const bars = page.locator('meta[name="theme-color"]')
            await expect(bars).toHaveCount(2)
            await expect(
                page.locator(
                    'meta[name="theme-color"][media="(prefers-color-scheme: light)"]',
                ),
            ).toHaveAttribute('content', /^#FFFFFF$/i)
            await expect(
                page.locator(
                    'meta[name="theme-color"][media="(prefers-color-scheme: dark)"]',
                ),
            ).toHaveAttribute('content', /^#161b22$/i)
            await expect(page.locator('body')).toHaveCSS(
                'background-color',
                'rgb(248, 250, 243)',
            )
        })
    }

    test('uses the app bar colour for the bottom bar on phones', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await gotoSettled(page, '/')
        await expect(page.locator('body')).toHaveCSS(
            'background-color',
            'rgb(255, 255, 255)',
        )
    })

    test('follows a theme switch', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 })
        await gotoSettled(page, '/')
        const toggle = page.getByTestId('nav-theme-toggle')
        await toggle.click()
        await toggle.click()
        await expect(toggle).toHaveAttribute('data-theme-mode', 'dark')
        const bars = page.locator('meta[name="theme-color"]')
        await expect(bars).toHaveCount(1)
        await expect(bars).not.toHaveAttribute('media')
        await expect(bars).toHaveAttribute('content', /^#161b22$/i)
        await expect(page.locator('body')).toHaveCSS(
            'background-color',
            'rgb(13, 17, 23)',
        )
    })

    test('follows the OS appearance live in system mode', async ({ page }) => {
        await gotoSettled(page, '/')
        await page.emulateMedia({ colorScheme: 'dark' })
        await expect(page.locator(appRoot)).toHaveClass(/v-theme--dark/)
        await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute(
            'content',
            'dark',
        )
        await page.emulateMedia({ colorScheme: 'light' })
        await expect(page.locator(appRoot)).toHaveClass(/v-theme--light/)
    })

    test('an explicit choice ignores OS appearance changes', async ({
        page,
    }) => {
        await gotoSettled(page, '/')
        await page.getByTestId('nav-theme-toggle').click()
        await expect(page.getByTestId('nav-theme-toggle')).toHaveAttribute(
            'data-theme-mode',
            'light',
        )
        await page.emulateMedia({ colorScheme: 'dark' })
        await page.waitForTimeout(300)
        await expect(page.locator(appRoot)).toHaveClass(/v-theme--light/)
    })

    test('an open dialog dims the bars with its scrim', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 })
        await gotoSettled(page, '/')
        await page.getByTestId('nav-theme-toggle').click()
        const bar = page.locator('meta[name="theme-color"]')
        await expect(bar).toHaveAttribute('content', /^#FFFFFF$/i)
        await page.keyboard.press('Control+k')
        await expect(bar).not.toHaveAttribute('content', /^#FFFFFF/i)
        await page.keyboard.press('Escape')
        await expect(bar).toHaveAttribute('content', /^#FFFFFF$/i)
    })

    test('a theme choice in one tab updates the other tabs', async ({
        context,
    }) => {
        const first = await context.newPage()
        const second = await context.newPage()
        await gotoSettled(first, '/')
        await gotoSettled(second, '/routes')
        await second.getByTestId('nav-theme-toggle').click()
        await second.getByTestId('nav-theme-toggle').click()
        await expect(second.locator(appRoot)).toHaveClass(/v-theme--dark/)
        await expect(first.locator(appRoot)).toHaveClass(/v-theme--dark/)
        await expect(first.getByTestId('nav-theme-toggle')).toHaveAttribute(
            'data-theme-mode',
            'dark',
        )
    })

    test('the installed app draws its own status bar', async ({ page }) => {
        await gotoSettled(page, '/')
        await expect(
            page.locator('meta[name="apple-mobile-web-app-status-bar-style"]'),
        ).toHaveAttribute('content', 'black-translucent')
    })

    test('color-scheme follows an explicit light choice on a dark OS', async ({
        browser,
        baseURL,
    }) => {
        const context = await browser.newContext({ colorScheme: 'dark' })
        await context.addCookies([
            { name: 'theme-mode', value: 'light', url: baseURL! },
        ])
        const page = await context.newPage()
        await gotoSettled(page, '/')
        await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute(
            'content',
            'light',
        )
        await expect(page.locator('html')).toHaveCSS('color-scheme', 'light')
        await expect(page.locator('html')).toHaveCSS(
            'background-color',
            'rgb(248, 250, 243)',
        )
        await context.close()
    })
})
