import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { PB_URL } from '../../support/map'
import { authAsSuperuser, ensureLocations, uiaa } from '../../support/seed'

test('a route change elsewhere keeps the visitor on their page', async ({
    page,
    testPrefix,
}) => {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const locations = await ensureLocations(root)

    await gotoSettled(page, '/routes')
    const range = page
        .getByTestId('index-table')
        .locator('.v-data-table-footer__info')
    await page.getByTestId('filter-search').locator('input').fill('e2e-route-')
    await expect(range).toContainText(/^\s*1\D/)
    await page.getByRole('button', { name: /next page/i }).click()
    await expect(range).toContainText(/^\s*21\D/)

    const reload = page.waitForResponse(
        (response) =>
            response.url().includes('/api/collections/averageRating/records') &&
            response.request().method() === 'GET',
    )
    const route = await root.collection('routes').create({
        name: `${testPrefix}-realtime`,
        ...uiaa('5'),
        location: locations['Hall A'],
        type: 'Route',
        creator: ['E2E'],
    })
    try {
        await reload
        await expect(range).toContainText(/^\s*21\D/)
    } finally {
        await root.collection('routes').delete(route.id)
    }
})
