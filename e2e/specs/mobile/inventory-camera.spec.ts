import { test, expect, chromium, devices, request } from '@playwright/test'
import path from 'node:path'
import os from 'node:os'
import { generateRouteQrY4m } from '../../support/qr'
import { gotoSettled } from '../../support/nav'

const AUTH_FILE = path.join(__dirname, '..', '..', '.auth', 'admin.json')

test('detects a route QR code via a fake video device', async ({ baseURL }) => {
    // This test carries its own browser (the fake-device flags are
    // browser-level) plus camera start-up and QR decoding, all while the other
    // workers are busy — 60s was not enough headroom on a loaded agent.
    test.setTimeout(120_000)
    const routeRes = await request.newContext({
        baseURL,
        ignoreHTTPSErrors: true,
    })
    // The inventory is scoped to one site, so scan a route known to be there.
    const res = await routeRes.get(
        '/api/collections/routes/records?filter=' +
            encodeURIComponent(
                'name ~ "e2e-route-" && archived = false && location = "Hanau"',
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

    await gotoSettled(page, '/admin/inventory')
    // The instructions dialog is shown once per device; skip it so the first
    // tap lands on the button rather than dismissing the dialog.
    await page.evaluate(() => {
        localStorage.setItem('inventory-instructions-seen', '1')
        localStorage.removeItem('inventory-scanned-route-ids')
    })
    await page.reload()

    // Assert before each click, so a page that never got this far fails here
    // with the step that stalled rather than as a bare test timeout.
    await expect(page.getByTestId('inventory-location-Hanau')).toBeVisible()
    await page.getByTestId('inventory-location-Hanau').click()

    // Enabled only once the initial route fetch lands (`loadingRoutes`), which
    // competes with every other worker plus this test's own second browser.
    await expect(page.getByTestId('inventory-start')).toBeEnabled({
        timeout: 30_000,
    })
    await page.getByTestId('inventory-start').click()

    await expect(page.locator('.scanner-viewport')).toBeVisible()
    await expect(page.getByTestId('inventory-found-count')).toHaveText('1', {
        timeout: 30_000,
    })

    // The scan overlay is drawn in CSS pixels onto a canvas whose bitmap the
    // library sizes from the video box. If the two boxes drift apart, the
    // bitmap is stretched to fit and every tracking rectangle and label lands
    // scaled and offset — which is what a viewport with no definite height did
    // on iOS.
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

    // Backgrounding ends the capture track on iOS and it cannot be revived, so
    // the page drops the dead stream and puts the Start button back — its tap
    // is the user gesture a fresh getUserMedia needs.
    await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: () => 'hidden',
        })
        document.dispatchEvent(new Event('visibilitychange'))
    })

    await expect(page.locator('.scanner-viewport')).toHaveCount(0)
    await expect(page.getByTestId('inventory-start')).toBeVisible()
    // The scan survives the interruption; only the camera goes.
    await expect(page.getByTestId('inventory-found-count')).toHaveText('1')

    await context.close()
    await browser.close()
})
