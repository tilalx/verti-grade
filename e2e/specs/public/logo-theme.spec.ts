import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test.describe('light OS preference', () => {
    test.use({ colorScheme: 'light' })

    test('shows the light logo without hydration warnings', async ({
        page,
    }) => {
        const warnings: string[] = []
        page.on('console', (message) => {
            if (/hydration/i.test(message.text())) warnings.push(message.text())
        })
        await gotoSettled(page, '/')

        const logo = page.getByTestId('nav-logo').locator('img:visible')
        await expect(logo).toHaveCount(1)
        const customLogo = page.getByTestId('nav-logo-custom')
        if (await customLogo.count()) {
            await expect(customLogo).toHaveCSS('filter', 'brightness(0)')
        } else {
            await expect(logo).toHaveAttribute('src', /gripello-light/)
        }
        expect(warnings).toEqual([])
    })
})

test.describe('dark OS preference', () => {
    test.use({ colorScheme: 'dark' })

    test('shows the dark logo', async ({ page }) => {
        await gotoSettled(page, '/')

        const logo = page.getByTestId('nav-logo').locator('img:visible')
        await expect(logo).toHaveCount(1)
        const customLogo = page.getByTestId('nav-logo-custom')
        if (await customLogo.count()) {
            await expect(customLogo).toHaveCSS(
                'filter',
                'brightness(0) invert(1)',
            )
        } else {
            await expect(logo).toHaveAttribute('src', /gripello-dark/)
        }
    })
})
