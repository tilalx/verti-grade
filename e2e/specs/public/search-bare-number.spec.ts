import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { PB_URL } from '../../support/map'
import { authAsSuperuser, ensureLocations, uiaa } from '../../support/seed'

test('a number that is no grade searches route names', async ({
    page,
    testPrefix,
}) => {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const locations = await ensureLocations(root)
    const digitFreePrefix = testPrefix.replace(
        /\d/g,
        (digit) => 'abcdefghij'[Number(digit)]!,
    )
    const createRoute = (name: string, screwDate: string) =>
        root.collection('routes').create({
            name,
            ...uiaa('5'),
            location: locations['Hall A'],
            type: 'Route',
            creator: ['E2E'],
            screw_date: screwDate,
        })
    const matching = await createRoute(
        `zz97zz ${digitFreePrefix}`,
        '2099-01-01',
    )
    const other = await createRoute(`${digitFreePrefix} other`, '2099-01-02')
    try {
        await gotoSettled(page, '/routes')
        await page.getByTestId('filter-search').locator('input').fill('97')
        await expect(page.getByTestId(`index-row-${matching.id}`)).toBeVisible()
        await expect(page.getByTestId(`index-row-${other.id}`)).toHaveCount(0)
    } finally {
        await root.collection('routes').delete(matching.id)
        await root.collection('routes').delete(other.id)
    }
})
