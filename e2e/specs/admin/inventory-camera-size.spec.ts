import { test, expect, chromium } from '@playwright/test'
import path from 'node:path'
import { gotoSettled } from '../../support/nav'
import { LOCATIONS } from '../../support/seed'

const AUTH_FILE = path.join(__dirname, '..', '..', '.auth', 'admin.json')

for (const viewport of [
    { name: 'desktop', width: 2000, height: 1200, minWidth: 700 },
    { name: 'ipad portrait', width: 820, height: 1180, minWidth: 750 },
]) {
    test(`${viewport.name} camera fills the controls column`, async ({
        baseURL,
    }) => {
        const browser = await chromium.launch({
            args: [
                '--use-fake-device-for-media-stream',
                '--use-fake-ui-for-media-stream',
            ],
        })
        const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
            baseURL,
            ignoreHTTPSErrors: true,
            storageState: AUTH_FILE,
            permissions: ['camera'],
        })
        const page = await context.newPage()
        await page.addInitScript(() =>
            localStorage.setItem('inventory-instructions-seen', '1'),
        )
        await gotoSettled(page, '/manage/inventory')
        await page.getByTestId(`inventory-location-${LOCATIONS[0]}`).click()
        await page.getByTestId('inventory-start').click()

        const camera = page.locator('.scanner-viewport')
        await expect(camera).toBeVisible()
        const box = (await camera.boundingBox())!
        expect(box.width).toBeGreaterThan(viewport.minWidth)
        expect(box.height).toBeGreaterThan(viewport.height * 0.4)
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)

        await browser.close()
    })
}
