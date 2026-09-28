import { chromium } from '@playwright/test'
import { test, expect, authFile } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

for (const viewport of [
    { name: 'desktop', width: 2000, height: 1200, minWidth: 700 },
    { name: 'ipad portrait', width: 820, height: 1180, minWidth: 750 },
]) {
    test(`${viewport.name} camera fills the controls column`, async ({
        baseURL,
        workerLocation,
    }) => {
        const browser = await chromium.launch({
            args: [
                '--use-fake-device-for-media-stream',
                '--use-fake-ui-for-media-stream',
            ],
        })
        try {
            const context = await browser.newContext({
                viewport: { width: viewport.width, height: viewport.height },
                baseURL,
                ignoreHTTPSErrors: true,
                storageState: authFile('admin'),
                permissions: ['camera'],
            })
            const page = await context.newPage()
            await page.addInitScript(() =>
                localStorage.setItem('inventory-instructions-seen', '1'),
            )
            await gotoSettled(page, '/manage/inventory')
            await page
                .getByTestId(`inventory-location-${workerLocation.name}`)
                .click()
            await page.getByTestId('inventory-start').click()

            const camera = page.getByTestId('scanner-viewport')
            await expect(camera).toBeVisible()
            await expect
                .poll(async () => {
                    const box = (await camera.boundingBox())!
                    return (
                        box.width > viewport.minWidth &&
                        box.height > viewport.height * 0.4 &&
                        box.y + box.height <= viewport.height
                    )
                })
                .toBe(true)
        } finally {
            await browser.close()
        }
    })
}
