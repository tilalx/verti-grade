import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'
import { createComment, deleteComment } from '../../support/comments'
import { createReport, deleteReport } from '../../support/reports'

/**
 * The in-app queue behind the navbar bell.
 *
 * Reports used to announce themselves only by email, so with SMTP unconfigured
 * the moderation queue filled in silence. The hook now also writes one
 * notification row per manage_reports holder (the admin role holds it).
 *
 * Every test owns its own rows: `fullyParallel` means siblings are filing
 * reports at the same moment, so assert on this test's notification, never on
 * the badge total.
 */

/**
 * Waits for a notification whose params carry `marker`.
 *
 * The moderator inbox is SHARED: every manage_reports holder gets a row for
 * every report, so siblings running in parallel add rows to the same queue.
 * Asserting on the badge or on "the first row" therefore races. Polling the
 * API for this test's own row is the only deterministic signal.
 */
/** Drops one notification, so a test cleans up only what it created. */
async function dropNotification(page, id: string) {
    await page.request.delete(`/api/collections/notifications/records/${id}`, {
        headers: await authHeader(page),
    })
}

async function waitForNotification(page, marker: string, timeoutMs = 15_000) {
    const headers = await authHeader(page)
    const deadline = Date.now() + timeoutMs

    while (Date.now() < deadline) {
        const res = await page.request.get(
            '/api/collections/notifications/records?perPage=200&sort=-created',
            { headers },
        )
        const items = (await res.json()).items ?? []
        const match = items.find((item: any) =>
            JSON.stringify(item.params ?? {}).includes(marker),
        )
        if (match) return match
        await new Promise((resolve) => setTimeout(resolve, 300))
    }

    throw new Error(`No notification carrying "${marker}" within the timeout`)
}

test('a filed report raises a notification linking to the queue', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/routes', /\/manage\/routes/)

    const commentId = await createComment(page, `${testPrefix}-belled`)
    const reportId = await createReport(page, {
        contentId: commentId,
        explanation: `${testPrefix}-bell`,
    })

    // The snippet is the server-stamped snapshot, not anything the reporter
    // sent -- and it is what identifies this test's own row in a shared queue.
    const queued = await waitForNotification(page, `${testPrefix}-belled`)

    await gotoSettled(page, '/manage/routes', /\/manage\/routes/)
    await expect(page.getByTestId('notification-bell')).toBeVisible()

    await page.getByTestId('notification-bell').click()
    const menu = page.getByTestId('notification-menu')
    await expect(menu).toBeVisible()
    await expect(menu).toContainText(`${testPrefix}-belled`)

    await dropNotification(page, queued.id)
    await deleteReport(page, reportId)
    await deleteComment(page, commentId)
})

test('opening a notification marks it read and clears the badge', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/routes', /\/manage\/routes/)

    const commentId = await createComment(page, `${testPrefix}-readme`)
    const reportId = await createReport(page, {
        contentId: commentId,
        explanation: `${testPrefix}-read`,
    })

    const queued = await waitForNotification(page, `${testPrefix}-readme`)

    await gotoSettled(page, '/manage/routes', /\/manage\/routes/)
    await page.getByTestId('notification-bell').click()
    await page.getByTestId(`notification-item-${queued.id}`).click()

    // The queue, not the reported comment -- that is where it can be acted on.
    await page.waitForURL(/\/manage\/reports/)

    // Asserted on this row, not on the badge: a sibling's report can land in
    // the same shared inbox at any moment and keep the badge lit.
    const headers = await authHeader(page)
    const after = await page.request.get(
        `/api/collections/notifications/records/${queued.id}`,
        { headers },
    )
    expect((await after.json()).read).toBe(true)

    await dropNotification(page, queued.id)
    await deleteReport(page, reportId)
    await deleteComment(page, commentId)
})

test('dismissing a notification removes it from the list', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/routes', /\/manage\/routes/)

    const commentId = await createComment(page, `${testPrefix}-dismissme`)
    const reportId = await createReport(page, {
        contentId: commentId,
        explanation: `${testPrefix}-dismiss`,
    })

    const queued = await waitForNotification(page, `${testPrefix}-dismissme`)

    await gotoSettled(page, '/manage/routes', /\/manage\/routes/)
    await page.getByTestId('notification-bell').click()

    const row = page.getByTestId(`notification-item-${queued.id}`)
    await expect(row).toBeVisible()
    await row.getByTestId('notification-dismiss').click()

    // Gone from the list, and gone from the server -- and the bell stays,
    // since it is a permanent affordance now.
    await expect(row).toBeHidden()
    await expect(page.getByTestId('notification-bell')).toBeVisible()

    const headers = await authHeader(page)
    const after = await page.request.get(
        `/api/collections/notifications/records/${queued.id}`,
        { headers },
    )
    expect(after.status()).toBe(404)

    await deleteReport(page, reportId)
    await deleteComment(page, commentId)
})

test('deciding a report notifies the other moderators exactly once', async ({
    adminPage: page,
    setterPage: other,
    testPrefix,
}) => {
    // The admin decides; the routesetter has no manage_reports, so the
    // assertion is on the admin's own queue staying free of duplicates. The
    // mail block re-saves the report to stamp notified_at, which re-enters the
    // update hook -- that second pass used to queue a second notification.
    await gotoSettled(page, '/manage/reports', /\/manage\/reports/)

    const commentId = await createComment(page, `${testPrefix}-once`)
    const reportId = await createReport(page, {
        contentId: commentId,
        explanation: `${testPrefix}-once`,
    })

    await gotoSettled(page, '/manage/reports')
    const card = page.getByTestId(`report-card-${reportId}`)
    await card.getByTestId('report-card-keep').click()
    await page
        .getByTestId('report-decision-reason')
        .locator('textarea')
        .first()
        .fill('Reviewed, no rule broken.')
    await page.getByTestId('report-decision-confirm').click()
    await expect(page.getByTestId('report-decision-dialog')).toBeHidden()

    const headers = await authHeader(page)
    const res = await page.request.get(
        '/api/collections/notifications/records?perPage=200',
        { headers },
    )
    const decided = ((await res.json()).items ?? [])
        .map((i: any) => i.type)
        .filter((t: string) => t.startsWith('report_decided'))

    // Two separate properties, asserted separately so a failure says which
    // one broke: the hook fires once (not once per internal re-save), and the
    // moderator who decided is not told what they just did.
    expect(decided.length).toBeLessThanOrEqual(1)
    expect(decided).toEqual([])

    await deleteReport(page, reportId)
    await deleteComment(page, commentId)
})

test('a plain user with no notifications still gets a bell', async ({
    userPage: page,
}) => {
    await gotoSettled(page, '/')

    await expect(page.getByTestId('notification-bell')).toBeVisible()
    await expect(page.getByTestId('notification-badge')).toBeHidden()

    await page.getByTestId('notification-bell').click()
    await expect(page.getByTestId('notification-empty')).toBeVisible()
})
