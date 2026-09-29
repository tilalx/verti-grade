import { chromium, devices } from '@playwright/test'
import os from 'node:os'
import path from 'node:path'
import { test, expect } from '../../support/fixtures'
import { generateRouteQrY4m } from '../../support/qr'
import { gotoSettled } from '../../support/nav'

test('scanning a route sign opens the route', async ({ baseURL, route }) => {
    test.setTimeout(120_000)
    const y4mPath = path.join(os.tmpdir(), `e2e-scan-${route.id}.y4m`)
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
            permissions: ['camera'],
        })
        const page = await context.newPage()
        await gotoSettled(page, '/scan')
        const viewport = page.getByTestId('scan-viewport')
        await expect(async () => {
            const frame = (await viewport.boundingBox())!
            const video = (await viewport.locator('video').boundingBox())!
            expect(video.height).toBeGreaterThanOrEqual(frame.height - 1)
        }).toPass()
        await page.waitForURL(new RegExp(`/route\\?id=${route.id}`), {
            timeout: 30_000,
        })
        await expect(page.getByTestId('route-page-name')).toBeVisible()
    } finally {
        await browser.close()
    }
})
