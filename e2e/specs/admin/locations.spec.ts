import type { Page } from '@playwright/test'
import { test, expect } from '../../support/fixtures'
import { authHeader, gotoSettled } from '../../support/nav'

const locationRow = (page: Page, name: string) =>
    page.locator(`[data-testid="settings-location"][data-name="${name}"]`)

test('admins add, rename and delete locations used by the route form', async ({
    adminPage: page,
    testPrefix,
}) => {
    const name = `${testPrefix} Hall`
    const renamed = `${testPrefix} Wall`

    await gotoSettled(page, '/admin/settings')
    await page.getByTestId('settings-location-new').locator('input').fill(name)
    await page.getByTestId('settings-location-add').click()
    await expect(locationRow(page, name)).toHaveCount(1)

    await locationRow(page, name)
        .getByTestId('settings-location-name')
        .locator('input')
        .fill(renamed)
    await page.keyboard.press('Enter')
    await expect(locationRow(page, renamed)).toHaveCount(1)

    await gotoSettled(page, '/manage/routes')
    await page.getByTestId('routes-create-open').click()
    await page.getByTestId('route-form-location').click()
    await expect(
        page.getByRole('option', { name: renamed, exact: true }),
    ).toBeVisible()

    await gotoSettled(page, '/admin/settings')
    await locationRow(page, renamed)
        .getByTestId('settings-location-delete')
        .click()
    await expect(locationRow(page, renamed)).toHaveCount(0)
})

test('a location that still has routes cannot be deleted', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/admin/settings')
    const headers = await authHeader(page)
    const name = `${testPrefix} Busy`

    const location = await (
        await page.request.post('/api/collections/locations/records', {
            headers,
            data: { name },
        })
    ).json()
    const route = await (
        await page.request.post('/api/collections/routes/records', {
            headers,
            data: {
                name: `${testPrefix}-busy-route`,
                difficulty: 4,
                location: location.id,
                type: 'Boulder',
                creator: ['E2E'],
            },
        })
    ).json()

    await gotoSettled(page, '/admin/settings')
    const row = locationRow(page, name)
    await row.getByTestId('settings-location-delete').click()
    await expect(page.getByTestId('global-snackbar')).toContainText(
        /cannot be deleted/,
    )
    await expect(row).toHaveCount(1)

    await page.request.delete(`/api/collections/routes/records/${route.id}`, {
        headers,
    })
    await row.getByTestId('settings-location-delete').click()
    await expect(row).toHaveCount(0)
})

test('only settings managers may change locations', async ({
    setterPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')
    const response = await page.request.post(
        '/api/collections/locations/records',
        { headers: await authHeader(page), data: { name: 'Setter Hall' } },
    )
    expect(response.status()).toBe(400)
})
