import { test, expect, chromium, devices, request } from '@playwright/test'
import os from 'node:os'
import path from 'node:path'
import { generateRouteQrY4m } from '../../support/qr'
import { gotoSettled } from '../../support/nav'

test('scanning a route sign opens the route', async ({ baseURL }) => {
    test.setTimeout(120_000)
    const api = await request.newContext({ baseURL, ignoreHTTPSErrors: true })
    const response = await api.get(
        '/api/collections/routes/records?filter=' +
            encodeURIComponent('name ~ "e2e-route-" && archived = false') +
            '&perPage=1',
    )
    const routeId = (await response.json()).items[0].id as string
    await api.dispose()

    const y4mPath = path.join(os.tmpdir(), `e2e-scan-${routeId}.y4m`)
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
        permissions: ['camera'],
    })
    const page = await context.newPage()
    try {
        await gotoSettled(page, '/scan')
        const viewport = (await page.locator('.scan-viewport').boundingBox())!
        const video = (await page
            .locator('.scan-viewport video')
            .boundingBox())!
        expect(video.height).toBeGreaterThanOrEqual(viewport.height - 1)
        await page.waitForURL(new RegExp(`/route\\?id=${routeId}`), {
            timeout: 30_000,
        })
        await expect(page.getByTestId('route-page-name')).toBeVisible()
    } finally {
        await browser.close()
    }
})
