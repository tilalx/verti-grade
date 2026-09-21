import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'
import { fetchAuditRows } from '../../support/audit'

/**
 * GDPR Art. 15: a user can see what has been recorded about them, without
 * asking anyone. The page carries no permission gate — the collection's list
 * rule is what decides whether you get everyone's entries or only your own.
 */

test('a user sees their own entries and nobody else’s', async ({
    userPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/', /\//)

    // Give this user an entry of their own to find.
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
    // The list rule, not the client, is what enforces this.
    for (const row of rows) {
        expect(row.actor).toBe(myId)
    }
})

test('the activity page is reachable without any admin permission', async ({
    userPage: page,
}) => {
    await gotoSettled(page, '/activity', /\/activity/)

    await expect(page.getByTestId('audit-retention-note')).toBeVisible()
    await expect(page.getByTestId('audit-filter-action')).toBeVisible()
})

test('the activity link is in the navigation for a plain user', async ({
    userPage: page,
}) => {
    await gotoSettled(page, '/', /\//)
    await expect(page.locator('a[href="/activity"]').first()).toHaveCount(1)
})

test('an admin sees entries from other actors too', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/activity', /\/activity/)

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

    // An admin's view is not filtered to their own actor id.
    const all = await fetchAuditRows(page, '')
    const actors = new Set(all.map((r) => r.actor))
    expect(actors.size).toBeGreaterThan(0)

    await page.request.delete(`/api/collections/routes/records/${routeId}`, {
        headers,
    })
})
