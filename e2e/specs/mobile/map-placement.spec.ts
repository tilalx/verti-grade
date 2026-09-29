import { test, expect } from '../../support/fixtures'
import { uiaa } from '../../support/seed'
import { gotoSettled } from '../../support/nav'
import { seedMap, type SeededMap } from '../../support/map'

let seeded: SeededMap
let unplacedIds: string[]

test.beforeEach(async ({ root, testPrefix }) => {
    seeded = await seedMap(root, testPrefix, { routes: 1 })
    unplacedIds = []
    for (const index of [1, 2]) {
        const route = await root.collection('routes').create({
            name: `${testPrefix}-phone-${index}`,
            ...uiaa('6'),
            location: seeded.locationId,
            anchor_point: 20 + index,
            type: 'Boulder',
            creator: ['E2E'],
        })
        unplacedIds.push(route.id)
    }
})

test('on a phone routes are placed one after another by tapping walls', async ({
    setterPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, `/manage/map?location=${seeded.locationId}`)
    await expect(page.getByTestId('placement-zoom-in')).toBeVisible()

    await page
        .locator(
            `[data-testid="placement-route"][data-route-id="${unplacedIds[0]}"]`,
        )
        .tap()
    const north = page.getByRole('button', {
        name: `${testPrefix} North`,
        exact: true,
    })
    await north.tap()
    await expect(page.getByTestId('placement-hint')).toContainText(
        `${testPrefix}-phone-2`,
    )
    await north.tap({ position: { x: 20, y: 5 } })

    for (const id of unplacedIds)
        await expect(
            page.locator(
                `[data-testid="placement-dot"][data-route-id="${id}"]`,
            ),
        ).toBeVisible()
})
