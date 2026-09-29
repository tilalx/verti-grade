import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { seedMap } from '../../support/map'

test('the map fills the phone screen and the list opens as a sheet', async ({
    page,
    root,
    testPrefix,
}) => {
    const seeded = await seedMap(root, testPrefix, { routes: 2 })
    try {
        await gotoSettled(page, `/map?location=${seeded.locationId}`)
        const svg = page.getByTestId('map-svg')
        const box = (await svg.boundingBox())!
        const viewport = page.viewportSize()!
        expect(box.width).toBeGreaterThan(viewport.width * 0.9)
        expect(box.height).toBeGreaterThan(viewport.height * 0.5)

        const before = await svg.getAttribute('viewBox')
        await page
            .locator(
                `[data-testid="map-wall-label"][data-name="${testPrefix} Island"]`,
            )
            .tap()
        await expect(svg).not.toHaveAttribute('viewBox', before!)

        await page.getByTestId('map-show-list').tap()
        await expect(page.getByTestId('map-list')).toContainText(
            `${testPrefix}-map-route-2`,
        )
    } finally {
        await seeded.cleanup()
    }
})

test('zooming in keeps labels of off-screen walls hidden and the header intact', async ({
    page,
    root,
    testPrefix,
}) => {
    const seeded = await seedMap(root, testPrefix, { routes: 2 })
    try {
        await gotoSettled(page, `/map?location=${seeded.locationId}`)
        const toggle = page.getByTestId('map-type')
        expect(
            await toggle.evaluate((el) => el.scrollWidth - el.clientWidth),
        ).toBeLessThanOrEqual(0)

        const zoomIn = page.getByRole('button', { name: 'Zoom in' })
        for (let i = 0; i < 12; i++) await zoomIn.click()
        const viewport = (await page.getByTestId('map-svg').boundingBox())!
        for (const label of await page.getByTestId('map-wall-label').all()) {
            const box = (await label.boundingBox())!
            expect(box.x).toBeGreaterThanOrEqual(viewport.x)
            expect(box.x + box.width).toBeLessThanOrEqual(
                viewport.x + viewport.width,
            )
        }
    } finally {
        await seeded.cleanup()
    }
})
