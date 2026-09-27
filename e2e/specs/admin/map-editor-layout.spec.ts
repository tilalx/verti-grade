import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { authAsSuperuser } from '../../support/seed'
import { gotoSettled } from '../../support/nav'
import { PB_URL, seedMap } from '../../support/map'

test.describe('narrow editor', () => {
    test.use({ viewport: { width: 900, height: 1000 } })

    test('stacks the side panel below the canvas', async ({
        adminPage: page,
        testPrefix,
    }) => {
        const root = new PocketBase(PB_URL)
        await authAsSuperuser(root)
        const seeded = await seedMap(root, testPrefix, { routes: 1 })
        try {
            await gotoSettled(page, `/admin/map?location=${seeded.locationId}`)
            const canvas = page.getByTestId('map-editor-canvas')
            const panel = page.getByTestId('map-editor-panel')
            await expect(canvas).toBeVisible()
            await expect(panel).toBeVisible()

            const canvasBox = (await canvas.boundingBox())!
            const panelBox = (await panel.boundingBox())!
            expect(panelBox.y).toBeGreaterThanOrEqual(
                canvasBox.y + canvasBox.height - 1,
            )
            expect(panelBox.width).toBeGreaterThan(600)
        } finally {
            await seeded.cleanup()
        }
    })
})

test('leaving with unsaved changes asks in a dialog', async ({
    adminPage: page,
    testPrefix,
}) => {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const seeded = await seedMap(root, testPrefix, { routes: 1 })
    try {
        await gotoSettled(page, `/admin/map?location=${seeded.locationId}`)
        await page
            .getByTestId('map-editor-new-wall')
            .locator('input')
            .fill(`${testPrefix} Draft`)
        await page.getByTestId('map-editor-add-wall').click()
        await expect(
            page.locator(
                `[data-testid="map-editor-wall-item"][data-name="${testPrefix} Draft"]`,
            ),
        ).toBeVisible()

        const mapLink = page
            .getByTestId('nav-desktop-links')
            .getByTestId('nav-link-map')
        await mapLink.click()
        const dialog = page.getByTestId('confirm-dialog')
        await expect(dialog).toBeVisible()
        await page.getByTestId('confirm-dialog-cancel').click()
        await expect(dialog).toBeHidden()
        await expect(page).toHaveURL(/\/admin\/map/)

        await mapLink.click()
        await page.getByTestId('confirm-dialog-confirm').click()
        await page.waitForURL(/\/map(\?|$)/)
    } finally {
        await seeded.cleanup()
    }
})
