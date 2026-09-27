import path from 'node:path'
import { test, expect } from '../../support/fixtures'
import { authHeader, gotoSettled } from '../../support/nav'
import { LOCATIONS, locationId, uiaa } from '../../support/seed'

const AUTH_FILE = path.join(__dirname, '..', '..', '.auth', 'admin.json')

test('editing a route west of UTC keeps its set date', async ({
    browser,
    baseURL,
    testPrefix,
}) => {
    const context = await browser.newContext({
        baseURL,
        ignoreHTTPSErrors: true,
        storageState: AUTH_FILE,
        timezoneId: 'America/New_York',
    })
    const page = await context.newPage()
    await gotoSettled(page, '/manage/routes')
    const headers = await authHeader(page)
    const name = `${testPrefix}-date`
    const created = await page.request.post('/api/collections/routes/records', {
        headers,
        data: {
            name,
            ...uiaa('5'),
            location: await locationId(page, LOCATIONS[0]),
            type: 'Route',
            creator: ['E2E'],
            screw_date: '2026-03-14 00:00:00.000Z',
        },
    })
    const routeId = (await created.json()).id as string

    await gotoSettled(page, '/manage/routes')
    await page.getByTestId('filter-search').locator('input').fill(name)
    await expect(page.getByTestId('routes-table')).toContainText(name)
    await page.getByTestId('routes-row-edit').first().click()
    await expect(page.getByTestId('route-form-dialog')).toBeVisible()
    await expect(
        page.getByTestId('route-form-screw-date').locator('input'),
    ).toHaveValue('2026-03-14')
    await page.getByTestId('route-form-submit').click()
    await expect(page.getByTestId('route-form-dialog')).toBeHidden()

    const saved = await page.request.get(
        `/api/collections/routes/records/${routeId}`,
        { headers },
    )
    expect((await saved.json()).screw_date).toMatch(/^2026-03-14/)

    await page.request.delete(`/api/collections/routes/records/${routeId}`, {
        headers,
    })
    await context.close()
})
