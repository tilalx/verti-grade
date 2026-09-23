import { test, expect, chromium, devices, request } from '@playwright/test'
import path from 'node:path'
import os from 'node:os'
import { generateRouteQrY4m } from '../../support/qr'
import { gotoSettled } from '../../support/nav'
import { LOCATIONS } from '../../support/seed'

const AUTH_FILE = path.join(__dirname, '..', '..', '.auth', 'admin.json')

test('detects a route QR code via a fake video device', async ({ baseURL }) => {
    test.setTimeout(120_000)
    const routeRes = await request.newContext({
        baseURL,
        ignoreHTTPSErrors: true,
    })
    const res = await routeRes.get(
        '/api/collections/routes/records?filter=' +
            encodeURIComponent(
                `name ~ "e2e-route-" && archived = false && location.name = "${LOCATIONS[0]}"`,
            ) +
            '&perPage=1',
    )
    const body = await res.json()
    const routeId = body.items[0].id as string
    await routeRes.dispose()

    const y4mPath = path.join(os.tmpdir(), `e2e-route-qr-${routeId}.y4m`)
    generateRouteQrY4m(routeId, y4mPath)

    const browser = await chromium.launch({
        args: [
            '--use-fake-device-for-media-stream',
            `--use-file-for-fake-video-capture=${y4mPath}`,
            '--use-fake-ui-for-media-stream',
        ],
    })
    const context = await browser.newContext({
        ...devices['Pixel 7'],
        baseURL,
        ignoreHTTPSErrors: true,
        storageState: AUTH_FILE,
        permissions: ['camera'],
    })
    const page = await context.newPage()

    await gotoSettled(page, '/manage/inventory')
    await page.evaluate(() => {
        localStorage.setItem('inventory-instructions-seen', '1')
        localStorage.removeItem('inventory-scanned-route-ids')
    })
    await gotoSettled(page, '/manage/inventory')

    const hallButton = page.getByTestId(`inventory-location-${LOCATIONS[0]}`)
    await expect(hallButton).toBeVisible()
    await hallButton.click()

    await expect(page.getByTestId('inventory-start')).toBeEnabled({
        timeout: 30_000,
    })
    await page.getByTestId('inventory-start').click()

    await expect(page.locator('.scanner-viewport')).toBeVisible()
    await expect(page.getByTestId('inventory-found-count')).toHaveText('1', {
        timeout: 30_000,
    })

    const overlay = await page.evaluate(() => {
        const canvas = document.querySelector<HTMLCanvasElement>(
            '#qrcode-stream-tracking-layer',
        )
        const video = document.querySelector<HTMLVideoElement>(
            '.scanner-viewport video',
        )
        if (!canvas || !video) return null
        const box = canvas.getBoundingClientRect()
        return {
            bitmap: [canvas.width, canvas.height],
            cssBox: [Math.round(box.width), Math.round(box.height)],
            videoBox: [video.offsetWidth, video.offsetHeight],
        }
    })
    expect(overlay).not.toBeNull()
    expect(overlay!.cssBox).toEqual(overlay!.bitmap)
    expect(overlay!.videoBox).toEqual(overlay!.bitmap)

    const torch = page.getByTestId('inventory-torch')
    if (await torch.isVisible()) {
        const button = (await torch.boundingBox())!
        const frame = (await page.locator('.scanner-viewport').boundingBox())!
        expect(button.y).toBeGreaterThan(frame.y + frame.height / 2)
        expect(button.x).toBeGreaterThan(frame.x + frame.width / 2)
    }

    await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: () => 'hidden',
        })
        document.dispatchEvent(new Event('visibilitychange'))
    })

    await expect(page.locator('.scanner-viewport')).toHaveCount(0)
    await expect(page.getByTestId('inventory-start')).toBeVisible()
    await expect(page.getByTestId('inventory-found-count')).toHaveText('1')

    await context.close()
    await browser.close()
})
