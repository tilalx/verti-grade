import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'
import { createComment, deleteComment } from '../../support/comments'
import {
    fetchAuditRows,
    fetchAuditRowsAnonymously,
    waitForAuditRow,
} from '../../support/audit'

/**
 * The audit log.
 *
 * Entries are written by PocketBase hooks after the request returns, so reads
 * poll. Every test filters by a record id it created itself — `fullyParallel`
 * means sibling tests are appending to this table the whole time.
 */

test('a create, an update and a delete each leave an entry', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/admin/routes', /\/admin\/routes/)

    const commentId = await createComment(page, `${testPrefix}-audited`)
    const created = await waitForAuditRow(
        page,
        `record_id = "${commentId}" && action = "create"`,
    )
    expect(created).toHaveLength(1)
    expect(created[0].collection_name).toBe('ratings')
    expect(created[0].actor_label).toBeTruthy()

    await deleteComment(page, commentId)
    const deleted = await waitForAuditRow(
        page,
        `record_id = "${commentId}" && action = "delete"`,
    )
    expect(deleted).toHaveLength(1)

    // The entry outlives the record it describes — that is the whole point of
    // record_id being plain text rather than a relation.
    const gone = await page.request.get(
        `/api/collections/ratings/records/${commentId}`,
    )
    expect(gone.status()).toBe(404)
    const still = await fetchAuditRows(page, `record_id = "${commentId}"`)
    expect(still.length).toBeGreaterThanOrEqual(2)
})

test('an update records the changed field names and none of the values', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/admin/routes', /\/admin\/routes/)

    const commentId = await createComment(page, `${testPrefix}-before`)
    const secret = `${testPrefix}-SECRET-VALUE`
    const res = await page.request.patch(
        `/api/collections/ratings/records/${commentId}`,
        {
            headers: await authHeader(page),
            data: { comment: secret },
        },
    )
    expect(res.ok()).toBeTruthy()

    const rows = await waitForAuditRow(
        page,
        `record_id = "${commentId}" && action = "update"`,
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].changed_fields).toContain('comment')

    // The minimisation guarantee: field names are stored, values never are.
    expect(JSON.stringify(rows[0])).not.toContain(secret)

    await deleteComment(page, commentId)
})

test('a failed sign-in is recorded without the attempted password', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/admin/routes', /\/admin\/routes/)

    const identity = `ghost-${testPrefix}@example.test`
    const badPassword = `wrong-${testPrefix}`
    const res = await page.request.post(
        '/api/collections/users/auth-with-password',
        { data: { identity, password: badPassword } },
    )
    expect(res.ok()).toBeFalsy()

    const rows = await waitForAuditRow(
        page,
        `action = "login_failed" && actor_label = "${identity}"`,
    )
    expect(rows).toHaveLength(1)
    expect(JSON.stringify(rows[0])).not.toContain(badPassword)
})

test('nobody can forge or erase an entry through the API', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/admin/routes', /\/admin\/routes/)
    const headers = await authHeader(page)

    const forged = await page.request.post(
        '/api/collections/audit_logs/records',
        {
            headers,
            data: { action: 'create', actor_label: `${testPrefix}-forged` },
        },
    )
    expect(forged.status()).toBe(403)

    const existing = await fetchAuditRows(page, 'action = "create"')
    expect(existing.length).toBeGreaterThan(0)
    const removed = await page.request.delete(
        `/api/collections/audit_logs/records/${existing[0].id}`,
        { headers },
    )
    expect(removed.status()).toBe(403)

    const stillThere = await fetchAuditRows(page, `id = "${existing[0].id}"`)
    expect(stillThere).toHaveLength(1)
})

test('a bulk archive leaves one entry per route', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/admin/routes', /\/admin\/routes/)
    const headers = await authHeader(page)

    const ids: string[] = []
    for (let i = 0; i < 2; i++) {
        const res = await page.request.post('/api/collections/routes/records', {
            headers,
            data: {
                name: `${testPrefix}-bulk-${i}`,
                difficulty: 5,
                location: 'Hanau',
                type: 'Boulder',
                creator: [testPrefix],
            },
        })
        ids.push((await res.json()).id as string)
    }

    // The batch API, as the bulk-archive button uses it. If batch sub-requests
    // bypassed the record hooks, every bulk operation would be an audit blind
    // spot — this is the test that says they do not.
    const batch = await page.request.post('/api/batch', {
        headers,
        data: {
            requests: ids.map((id) => ({
                method: 'PATCH',
                url: `/api/collections/routes/records/${id}`,
                body: { archived: true },
            })),
        },
    })
    expect(batch.ok()).toBeTruthy()

    for (const id of ids) {
        const rows = await waitForAuditRow(
            page,
            `record_id = "${id}" && action = "update"`,
        )
        expect(rows).toHaveLength(1)
        expect(rows[0].changed_fields).toContain('archived')
    }

    for (const id of ids) {
        await page.request.delete(`/api/collections/routes/records/${id}`, {
            headers,
        })
    }
})

test('an anonymous caller cannot read the audit log', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/routes', /\/admin\/routes/)

    // Regression for the list rule: without its `@request.auth.id != ""`
    // guard, `actor = @request.auth.id` matches every anonymous entry and the
    // whole anonymous slice — IP addresses included — becomes world-readable.
    const body = await fetchAuditRowsAnonymously(page)
    expect(body.totalItems ?? 0).toBe(0)
})
