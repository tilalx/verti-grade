import { test, expect, authFile } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

function luminance(color: string) {
    const [r, g, b] = color
        .match(/\d+(\.\d+)?/g)!
        .slice(0, 3)
        .map((channel) => {
            const value = Number(channel) / 255
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
    test.describe(`${colorScheme} mode`, () => {
        test.use({ colorScheme, storageState: authFile('user') })

        test(`profile header text is readable in ${colorScheme} mode`, async ({
            page,
        }) => {
            await gotoSettled(page, '/account/settings')

            const header = page.getByTestId('profile-header')
            await expect(header).toBeVisible()
            const backgroundImage = await header.evaluate(
                (el) => getComputedStyle(el).backgroundImage,
            )
            expect(backgroundImage).not.toContain('gradient')
            const [background, text] = await header.evaluate((el) => {
                const context = document
                    .createElement('canvas')
                    .getContext('2d', { willReadFrequently: true })!
                const toRgb = (color: string) => {
                    context.clearRect(0, 0, 1, 1)
                    context.fillStyle = color
                    context.fillRect(0, 0, 1, 1)
                    const [r, g, b] = context.getImageData(0, 0, 1, 1).data
                    return `rgb(${r}, ${g}, ${b})`
                }
                let surface: Element | null = el
                while (
                    surface &&
                    ['transparent', 'rgba(0, 0, 0, 0)'].includes(
                        getComputedStyle(surface).backgroundColor,
                    )
                ) {
                    surface = surface.parentElement
                }
                return [
                    toRgb(
                        getComputedStyle(surface ?? document.body)
                            .backgroundColor,
                    ),
                    toRgb(getComputedStyle(el.querySelector('h1')!).color),
                ]
            })
            expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5)
        })
    })
}
