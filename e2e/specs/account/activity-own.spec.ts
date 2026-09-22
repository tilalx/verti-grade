import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'
import { fetchAuditRows } from '../../support/audit'

test('a user sees their own entries and nobody else’s', async ({
    userPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/', /\//)

    const headers = await authHeader(page)
    const me = await page.request.post('/api/collections/users/auth-refresh', {
        headers,
    })
    const myId = (await me.json()).record?.id as string
    expect(myId).toBeTruthy()

    await page.request.patch(`/api/collections/users/records/${myId}`, {
        headers,
        data: { firstname: `${testPrefix}-self` },
    })

    const rows = await fetchAuditRows(page, '')
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
        expect(row.actor).toBe(myId)
    }
})

test('the activity page is reachable without any admin permission', async ({
    userPage: page,
}) => {
    await gotoSettled(page, '/account/activity', /\/account\/activity/)

    await expect(page.getByTestId('audit-retention-note')).toBeVisible()
    await expect(page.getByTestId('audit-filter-action')).toBeVisible()
})

test('a plain user reaches their activity from the user menu', async ({
    userPage: page,
}) => {
    await gotoSettled(page, '/', /\//)

    await page.getByTestId('user-menu-activator').click()
    const entry = page.getByTestId('user-menu-activity')
    await expect(entry).toBeVisible()
    await expect(entry).toHaveAttribute('href', '/account/activity')
})

test('an admin sees entries from other actors too', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/account/activity', /\/account\/activity/)

    const headers = await authHeader(page)
    const res = await page.request.post('/api/collections/routes/records', {
        headers,
        data: {
            name: `${testPrefix}-admin-visible`,
            difficulty: 5,
            location: 'Hanau',
            type: 'Boulder',
            creator: [testPrefix],
        },
    })
    const routeId = (await res.json()).id as string

    const rows = await fetchAuditRows(page, `record_id = "${routeId}"`)
    expect(rows.length).toBeGreaterThan(0)

    const all = await fetchAuditRows(page, '')
    const actors = new Set(all.map((r) => r.actor))
    expect(actors.size).toBeGreaterThan(0)

    await page.request.delete(`/api/collections/routes/records/${routeId}`, {
        headers,
    })
})
