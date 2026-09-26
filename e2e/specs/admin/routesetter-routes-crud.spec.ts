import { test, expect } from '../../support/fixtures'
import { LOCATIONS, uiaa } from '../../support/seed'
import { gotoSettled, authHeader } from '../../support/nav'

test('routesetter can create and delete a route (manage_routes permission)', async ({
    setterPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')

    const name = `e2e-setter-${Date.now()}`

    await page.getByTestId('routes-create-open').click()
    await expect(page.getByTestId('route-form-dialog')).toBeVisible()
    await page.getByTestId('route-form-name').locator('input').fill(name)
    await page.getByTestId('route-form-difficulty').click()
    await page.getByRole('option', { name: '5', exact: true }).click()
    await page.getByTestId('route-form-type').click()
    await page.getByRole('option', { name: 'Route', exact: true }).click()
    await page
        .getByTestId('route-form-anchor-point')
        .locator('input')
        .fill('10')
    await page.getByTestId('route-form-location').click()
    await page.getByRole('option', { name: LOCATIONS[0], exact: true }).click()
    await page
        .getByTestId('route-form-creator')
        .locator('input')
        .fill('E2E Setter')
    await page.keyboard.press('Enter')
    await page
        .getByTestId('route-form-screw-date')
        .locator('input')
        .fill('2026-01-01')
    await page.getByTestId('route-form-submit').click()
    await expect(page.getByTestId('route-form-dialog')).toBeHidden()

    await page.getByTestId('filter-search').locator('input').fill(name)
    await expect(page.getByTestId('routes-table')).toContainText(name)

    await page.getByTestId('routes-row-edit').first().click()
    await page.getByTestId('route-form-delete').click()
    await page.getByTestId('confirm-dialog-confirm').click()
    await expect(page.getByTestId('route-form-dialog')).toBeHidden()

    await page.getByTestId('filter-search').locator('input').fill(name)
    await expect(page.getByTestId('routes-table')).not.toContainText(name)
})

test('a user without manage_routes cannot reach or write to /manage/routes', async ({
    userPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')
    await page.waitForURL((url) => !url.pathname.endsWith('/manage/routes'))

    const headers = await authHeader(page)
    const res = await page.request.post('/api/collections/routes/records', {
        headers,
        data: {
            name: 'should-not-be-created-by-user',
            ...uiaa('1'),
        },
    })
    expect(res.status()).toBeGreaterThanOrEqual(400)
})
