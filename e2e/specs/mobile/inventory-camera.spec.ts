import { chromium, devices } from '@playwright/test'
import path from 'node:path'
import os from 'node:os'
import { test, expect, authFile } from '../../support/fixtures'
import { generateRouteQrY4m } from '../../support/qr'
import { gotoSettled } from '../../support/nav'

test('detects a route QR code via a fake video device', async ({
    baseURL,
    route,
    workerLocation,
}) => {
    test.setTimeout(120_000)
    const y4mPath = path.join(os.tmpdir(), `e2e-route-qr-${route.id}.y4m`)
    generateRouteQrY4m(route.id, y4mPath)

    const browser = await chromium.launch({
        args: [
            '--use-fake-device-for-media-stream',
            `--use-file-for-fake-video-capture=${y4mPath}`,
            '--use-fake-ui-for-media-stream',
        ],
    })
    try {
        const context = await browser.newContext({
            ...devices['Pixel 7'],
            baseURL,
            ignoreHTTPSErrors: true,
            storageState: authFile('admin'),
            permissions: ['camera'],
        })
        const page = await context.newPage()

        await gotoSettled(page, '/manage/inventory')
        await page.evaluate(() => {
            localStorage.setItem('inventory-instructions-seen', '1')
            localStorage.removeItem('inventory-scanned-route-ids')
        })
        await gotoSettled(page, '/manage/inventory')

        await page
            .getByTestId(`inventory-location-${workerLocation.name}`)
            .click()

        await expect(page.getByTestId('inventory-start')).toBeEnabled({
            timeout: 30_000,
        })
        await page.getByTestId('inventory-start').click()

        const viewport = page.getByTestId('scanner-viewport')
        await expect(viewport).toBeVisible()
        await expect(page.getByTestId('inventory-found-count')).toHaveText(
            '1',
            { timeout: 30_000 },
        )

        const overlay = page.getByTestId('qr-tracking-layer')
        await expect(overlay.locator('rect').first()).toBeAttached()
        await expect(async () => {
            const overlayBox = (await overlay.boundingBox())!
            const videoBox = (await viewport.locator('video').boundingBox())!
            expect(overlayBox).toEqual(videoBox)
            await expect(overlay).toHaveAttribute(
                'viewBox',
                `0 0 ${Math.round(videoBox.width)} ${Math.round(videoBox.height)}`,
                { timeout: 0 },
            )
        }).toPass()

        await page.evaluate(() => {
            Object.defineProperty(document, 'visibilityState', {
                configurable: true,
                get: () => 'hidden',
            })
            document.dispatchEvent(new Event('visibilitychange'))
        })

        await expect(viewport).toHaveCount(0)
        await expect(page.getByTestId('inventory-start')).toBeVisible()
        await expect(page.getByTestId('inventory-found-count')).toHaveText('1')
    } finally {
        await browser.close()
    }
})
