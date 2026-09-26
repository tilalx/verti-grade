import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

function luminance(color: string) {
    const scale = color.startsWith('color(') ? 1 : 255
    const [r, g, b] = color
        .match(/\d+(\.\d+)?/g)!
        .slice(0, 3)
        .map((channel) => {
            const value = Number(channel) / scale
            return value <= 0.03928
                ? value / 12.92
                : ((value + 0.055) / 1.055) ** 2.4
        })
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

const contrast = (a: string, b: string) => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (high! + 0.05) / (low! + 0.05)
}

for (const colorScheme of ['light', 'dark'] as const) {
    test(`profile header text is readable in ${colorScheme} mode`, async ({
        browser,
        deviceOptions,
    }) => {
        const context = await browser.newContext({
            ...deviceOptions,
            colorScheme,
            storageState: 'e2e/.auth/user.json',
        })
        const page = await context.newPage()
        await gotoSettled(page, '/')
        await page.getByTestId('user-menu-activator').click()
        await page.getByTestId('user-menu-profile').click()

        const header = page.getByTestId('profile-header')
        await expect(header).toBeVisible()
        const [background, text] = await header.evaluate((el) => [
            getComputedStyle(el).backgroundColor,
            getComputedStyle(el.querySelector('.text-title-large')!).color,
        ])
        expect(background).not.toContain('gradient')
        expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5)
        await context.close()
    })
}
