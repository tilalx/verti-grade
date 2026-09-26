import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`${colorScheme} theme`, () => {
        test.use({ colorScheme, viewport: { width: 1280, height: 800 } })

        test('brand headline contrasts with the brand panel', async ({
            page,
        }) => {
            await gotoSettled(page, '/auth/login')
            const title = page.getByTestId('auth-brand-title')
            await expect(title).toBeVisible()
            const [textColor, panelColor] = await title.evaluate((el) => [
                getComputedStyle(el).color,
                getComputedStyle(el.closest('.brand-panel')!).backgroundColor,
            ])
            expect(textColor).not.toBe(panelColor)
            expect(textColor).not.toBe(
                colorScheme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
            )
        })
    })
}
