import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'
import { LOCATIONS, locationId } from '../../support/seed'

test('selects filtered routes and archives them', async ({
    adminPage: page,
}) => {
    const prefix = `e2e-archive-${Date.now()}`

    await gotoSettled(page, '/manage/routes')
    const headers = await authHeader(page)
    const hallA = await locationId(page, LOCATIONS[0])

    for (let i = 0; i < 2; i++) {
        await page.request.post('/api/collections/routes/records', {
            headers,
            data: {
                name: `${prefix}-${i}`,
                difficulty: 5,
                anchor_point: 5,
                location: hallA,
                type: 'Route',
                creator: ['E2E'],
                screw_date: '2026-01-01',
                archived: false,
            },
        })
    }

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.getByTestId('filter-search').locator('input').fill(prefix)
    await expect(page.getByTestId('routes-table')).toContainText(`${prefix}-0`)

    await page.getByTestId('routes-select-all').click()
    await page.getByTestId('routes-archive-selected').click()
    await page.getByTestId('confirm-dialog-confirm').click()

    await expect(page.getByTestId('global-snackbar')).toBeVisible()

    await page.getByTestId('routes-filter-archived').click()
    await expect(page.getByTestId('routes-table')).toContainText(`${prefix}-0`)
})

test('hides the archive action when nothing is selected', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')
    await expect(page.getByTestId('routes-archive-selected')).toHaveCount(0)
})

test('shows an error and keeps routes when archiving fails', async ({
    adminPage: page,
}) => {
    const prefix = `e2e-archive-fail-${Date.now()}`
    await gotoSettled(page, '/manage/routes')
    const headers = await authHeader(page)
    const hallA = await locationId(page, LOCATIONS[0])

    for (let i = 0; i < 2; i++) {
        await page.request.post('/api/collections/routes/records', {
            headers,
            data: {
                name: `${prefix}-${i}`,
                difficulty: 5,
                anchor_point: 5,
                location: hallA,
                type: 'Route',
                creator: ['E2E'],
                screw_date: '2026-01-01',
                archived: false,
            },
        })
    }

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.getByTestId('filter-search').locator('input').fill(prefix)
    await expect(page.getByTestId('routes-table')).toContainText(`${prefix}-0`)

    await page.route('**/api/batch', (route) => route.abort('failed'))

    await page.getByTestId('routes-select-all').click()
    await page.getByTestId('routes-archive-selected').click()
    await page.getByTestId('confirm-dialog-confirm').click()

    await expect(page.getByTestId('global-snackbar')).toBeVisible()
    await expect(page.getByTestId('routes-table')).toContainText(`${prefix}-0`)
})
