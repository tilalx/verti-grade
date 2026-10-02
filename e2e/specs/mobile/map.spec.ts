import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { centerOf, seedMap, settledBox, touchInput } from '../../support/map'

test('the map fills the phone screen and the list sits in a sheet', async ({
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

        const handle = page.getByTestId('map-sheet-handle')
        await expect(handle).toHaveAttribute('aria-expanded', 'false')
        await handle.tap()
        await expect(handle).toHaveAttribute('aria-expanded', 'true')
        await expect(page.getByTestId('map-list')).toContainText(
            `${testPrefix}-map-route-2`,
        )
    } finally {
        await seeded.cleanup()
    }
})

test('dragging the sheet up expands it and tapping a route shows it in the sheet', async ({
    page,
    root,
    testPrefix,
}) => {
    const seeded = await seedMap(root, testPrefix, { routes: 2 })
    try {
        await gotoSettled(page, `/map?location=${seeded.locationId}`)
        const sheet = page.getByTestId('map-list')
        const peekTop = (await sheet.boundingBox())!.y
        const { x, y } = centerOf(
            await settledBox(page.getByTestId('map-sheet-handle')),
        )
        const touch = await touchInput(page)
        await touch('touchStart', { x, y })
        for (let step = 1; step <= 10; step++)
            await touch('touchMove', { x, y: y - step * 30 })
        const restBeforeLiftMs = 150
        await page.waitForTimeout(restBeforeLiftMs)
        await touch('touchMove', { x, y: y - 300 })
        await touch('touchEnd')
        await expect
            .poll(async () => (await sheet.boundingBox())!.y)
            .toBeLessThan(peekTop - 200)
        await settledBox(sheet)

        await sheet
            .locator(
                `[data-testid="map-list-route"][data-route-id="${seeded.routeIds[1]}"] button`,
            )
            .tap()
        await expect(page.getByTestId('map-route-card')).toContainText(
            `${testPrefix}-map-route-2`,
        )
        await page.getByTestId('map-route-card-close').tap()
        await expect(page.getByTestId('map-route-card')).toHaveCount(0)
    } finally {
        await seeded.cleanup()
    }
})

test('max zoom separates routes 20 cm apart for tapping', async ({
    page,
    root,
    testPrefix,
}) => {
    const seeded = await seedMap(root, testPrefix, { routes: 3 })
    try {
        const [, neighbour, islandRoute] = seeded.routeIds
        const islandEdgeLength = 17
        await root.collection('routes').update(neighbour!, {
            wall: seeded.islandWallId,
            wall_position: 0.75 + 0.2 / islandEdgeLength,
        })
        await gotoSettled(page, `/map?location=${seeded.locationId}`)

        const dotCenter = async (routeId: string) =>
            centerOf(
                await settledBox(
                    page.locator(
                        `[data-testid="map-route-dot"][data-route-id="${routeId}"] .map-dot-body`,
                    ),
                ),
            )
        const cluster = page.getByTestId('map-route-cluster')
        await expect(cluster).toHaveAttribute('data-count', '2')
        const clusterCenter = centerOf(await settledBox(cluster))
        await page.getByTestId('map-svg').dispatchEvent('wheel', {
            deltaY: -1000,
            ctrlKey: true,
            clientX: clusterCenter.x,
            clientY: clusterCenter.y,
        })
        await expect(cluster).toHaveCount(0)

        const a = await dotCenter(islandRoute!)
        const b = await dotCenter(neighbour!)
        const coarseHitDiameterPx = 44
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(
            coarseHitDiameterPx,
        )

        await page.touchscreen.tap(b.x, b.y)
        await expect(page.getByTestId('map-route-card')).toContainText(
            `${testPrefix}-map-route-2`,
        )
        await page.touchscreen.tap(a.x, a.y)
        await expect(page.getByTestId('map-route-card')).toContainText(
            `${testPrefix}-map-route-3`,
        )
    } finally {
        await seeded.cleanup()
    }
})

test('routes on the same spot open from a cluster', async ({
    page,
    root,
    testPrefix,
}) => {
    const seeded = await seedMap(root, testPrefix, { routes: 3 })
    try {
        const [, neighbour, islandRoute] = seeded.routeIds
        await root.collection('routes').update(neighbour!, {
            wall: seeded.islandWallId,
            wall_position: 0.75,
        })
        await gotoSettled(page, `/map?location=${seeded.locationId}`)

        const cluster = page.getByTestId('map-route-cluster')
        await expect(cluster).toHaveAttribute('data-count', '2')
        await expect(
            page.locator(
                `[data-testid="map-route-dot"][data-route-id="${neighbour}"]`,
            ),
        ).toHaveCount(0)
        await cluster.tap()
        await expect(cluster).toHaveCount(0)

        const spreadDot = page.locator(
            `[data-testid="map-route-dot"][data-route-id="${neighbour}"] .map-dot-body`,
        )
        const { x, y } = centerOf(await settledBox(spreadDot))
        await page.touchscreen.tap(x, y)
        await expect(page.getByTestId('map-route-card')).toContainText(
            `${testPrefix}-map-route-2`,
        )
        await expect(
            page.locator(
                `[data-testid="map-route-dot"][data-route-id="${islandRoute}"]`,
            ),
        ).toHaveCount(1)
    } finally {
        await seeded.cleanup()
    }
})

test('zooming in keeps labels of off-screen walls hidden and the chips scroll inside the map', async ({
    page,
    root,
    testPrefix,
}) => {
    const seeded = await seedMap(root, testPrefix, { routes: 2 })
    try {
        await gotoSettled(page, `/map?location=${seeded.locationId}`)
        expect(
            await page.evaluate(
                () =>
                    document.scrollingElement!.scrollWidth -
                    document.scrollingElement!.clientWidth,
            ),
        ).toBeLessThanOrEqual(0)

        const zoomIn = page.getByTestId('map-zoom-in')
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
