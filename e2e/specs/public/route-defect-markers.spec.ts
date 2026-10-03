import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { authAsSuperuser } from '../../support/seed'
import { PB_URL, seedMap } from '../../support/map'

test('routes with open defects are marked on the map and in its list', async ({
    page,
    testPrefix,
}) => {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const seeded = await seedMap(root, testPrefix, { routes: 3 })
    const [urgentRoute, minorRoute, cleanRoute] = seeded.routeIds
    try {
        await root.collection('tasks').create({
            kind: 'defect',
            route: urgentRoute,
            category: 'broken_hold',
        })
        await root.collection('tasks').create({
            kind: 'defect',
            route: minorRoute,
            category: 'label_tag',
        })

        await gotoSettled(page, `/map?location=${seeded.locationId}`)
        const dot = (id: string) =>
            page.locator(`[data-testid="map-route-dot"][data-route-id="${id}"]`)
        await expect(dot(urgentRoute)).toHaveAttribute('data-defect', 'urgent')
        await expect(dot(minorRoute)).toHaveAttribute('data-defect', 'minor')
        await expect(dot(cleanRoute)).not.toHaveAttribute('data-defect')

        const listRow = page.locator(
            `[data-testid="map-list-route"][data-route-id="${urgentRoute}"]`,
        )
        await expect(
            listRow.getByTestId('route-defect-marker'),
        ).toHaveAttribute('data-severity', 'urgent')
    } finally {
        await seeded.cleanup()
    }
})

test('a route with an open defect is marked in the route list', async ({
    page,
    root,
    route,
}) => {
    await root.collection('tasks').create({
        kind: 'defect',
        route: route.id,
        category: 'sharp_edge',
    })

    await gotoSettled(page, '/routes')
    await page.getByTestId('filter-search').fill(route.name)
    const entry = page
        .locator(
            `[data-testid="index-row-${route.id}"], [data-testid="route-card-${route.id}"]`,
        )
        .first()
    await expect(entry.getByTestId('route-defect-marker')).toHaveAttribute(
        'data-severity',
        'minor',
    )
})
