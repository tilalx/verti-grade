import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'

test('selects filtered routes and archives them', async ({
    adminPage: page,
}) => {
    const prefix = `e2e-archive-${Date.now()}`

    // Navigate first: storageState's localStorage is only applied once the
    // page has loaded the matching origin, so the auth token isn't readable
    // (or attachable to page.request calls) before that first navigation.
    await gotoSettled(page, '/admin/routes')
    const headers = await authHeader(page)

    // Create two routes scoped to this test via the API so "select all"
    // only ever touches records this test owns, not the shared seed set.
    for (let i = 0; i < 2; i++) {
        await page.request.post('/api/collections/routes/records', {
            headers,
            data: {
                name: `${prefix}-${i}`,
                difficulty: 5,
                anchor_point: 5,
                location: 'Hanau',
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
