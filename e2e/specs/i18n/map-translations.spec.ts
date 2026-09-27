import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { authAsSuperuser, uiaa } from '../../support/seed'
import { gotoSettled } from '../../support/nav'
import { PB_URL, seedMap, type SeededMap } from '../../support/map'

const TEXT: Record<
    string,
    { oneChecked: string; twoChecked: string; boulder: string; red: string }
> = {
    'de-DE': {
        oneChecked: '1 Route ausgewählt',
        twoChecked: '2 Routen ausgewählt',
        boulder: 'Boulder',
        red: 'Rot',
    },
    'ru-RU': {
        oneChecked: 'Выбрано трасс: 1',
        twoChecked: 'Выбрано трасс: 2',
        boulder: 'Боулдер',
        red: 'Красный',
    },
    'tr-TR': {
        oneChecked: '1 rota seçildi',
        twoChecked: '2 rota seçildi',
        boulder: 'Boulder',
        red: 'Kırmızı',
    },
    'uk-UA': {
        oneChecked: 'Вибрано трас: 1',
        twoChecked: 'Вибрано трас: 2',
        boulder: 'Боулдер',
        red: 'Червоний',
    },
}

let seeded: SeededMap
let unplacedIds: string[]

test.beforeEach(async ({ testPrefix }) => {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    seeded = await seedMap(root, testPrefix, { routes: 1 })
    unplacedIds = []
    for (const index of [1, 2]) {
        const route = await root.collection('routes').create({
            name: `${testPrefix}-unplaced-${index}`,
            ...uiaa('6'),
            location: seeded.locationId,
            anchor_point: 10 + index,
            type: 'Boulder',
            color: '#00ACC1',
            creator: ['E2E'],
            screw_date: '2026-09-01',
        })
        unplacedIds.push(route.id)
    }
    seeded.routeIds.push(...unplacedIds)
})

test.afterEach(async () => {
    await seeded.cleanup()
})

test('checked route count uses the plural form of the locale', async ({
    setterPage: page,
}, testInfo) => {
    const text = TEXT[testInfo.project.use.locale as string]!
    await gotoSettled(page, `/manage/map?location=${seeded.locationId}`)
    const check = (id: string) =>
        page
            .locator(`[data-testid="placement-route"][data-route-id="${id}"]`)
            .getByTestId('placement-route-check')

    await check(unplacedIds[0]!).click()
    await expect(page.getByTestId('placement-checked')).toContainText(
        text.oneChecked,
    )
    await check(unplacedIds[1]!).click()
    await expect(page.getByTestId('placement-checked')).toContainText(
        text.twoChecked,
    )
    await expect(page.getByTestId('placement-checked')).not.toContainText('|')
})

test('route card shows the translated route type', async ({
    page,
}, testInfo) => {
    const text = TEXT[testInfo.project.use.locale as string]!
    await gotoSettled(
        page,
        `/map?location=${seeded.locationId}&route=${seeded.routeIds[0]}`,
    )
    await expect(
        page.getByTestId('map-route-card').getByTestId('route-card-type'),
    ).toHaveText(text.boulder)
})

test('map dots name the route colour in the active locale', async ({
    page,
    testPrefix,
}, testInfo) => {
    const text = TEXT[testInfo.project.use.locale as string]!
    await gotoSettled(page, `/map?location=${seeded.locationId}`)
    await expect(
        page.locator(
            `[data-testid="map-route-dot"][data-route-id="${seeded.routeIds[0]}"]`,
        ),
    ).toHaveAttribute('aria-label', `${testPrefix}-map-route-1, ${text.red}`)
})
