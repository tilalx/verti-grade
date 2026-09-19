import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

async function firstTwoSeededRouteIds(page: import('@playwright/test').Page) {
    const res = await page.request.get(
        '/api/collections/routes/records?filter=' +
            encodeURIComponent('name ~ "e2e-route-" && archived = false') +
            '&perPage=2',
    )
    const body = await res.json()
    return body.items.map((r: { id: string }) => r.id) as string[]
}

test('drives the scan/finish/archive flow via seeded localStorage, no camera', async ({
    adminPage: page,
}) => {
    const ids = await firstTwoSeededRouteIds(page)

    await gotoSettled(page, '/admin/inventory')
    await page.evaluate((scannedIds) => {
        localStorage.setItem(
            'inventory-scanned-route-ids',
            JSON.stringify(scannedIds),
        )
    }, ids)
    await page.reload()
    await page.waitForLoadState('networkidle')
    // The instructions dialog auto-opens on every mount when on mobile
    // (app/pages/admin/inventory.vue onMounted) and otherwise blocks clicks.
    await page.keyboard.press('Escape')

    await expect(page.getByTestId('inventory-found-count')).toHaveText(
        String(ids.length),
    )

    await page.getByTestId('inventory-finish-open').click()
    await expect(page.getByTestId('inventory-finish-dialog')).toBeVisible()
    await page.getByTestId('inventory-finish-confirm').click()

    await expect(page.getByTestId('inventory-finish-dialog')).toBeHidden()
})
