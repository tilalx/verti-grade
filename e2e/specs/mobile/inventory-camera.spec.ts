import { test, expect, chromium, devices, request } from '@playwright/test'
import path from 'node:path'
import os from 'node:os'
import { generateRouteQrY4m } from '../../support/qr'
import { gotoSettled } from '../../support/nav'

const AUTH_FILE = path.join(__dirname, '..', '..', '.auth', 'admin.json')

test('detects a route QR code via a fake video device', async ({ baseURL }) => {
    test.setTimeout(60_000)
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

    await page.getByTestId('inventory-location').click()
    await page.getByRole('option', { name: 'Hanau' }).click()

    await page.getByTestId('inventory-start').click()
    await expect(page.getByTestId('inventory-found-count')).toHaveText('1', {
        timeout: 15_000,
    })

    await context.close()
    await browser.close()
})
