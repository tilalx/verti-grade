import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'
import { createComment, deleteComment } from '../../support/comments'
import { createReport, deleteReport } from '../../support/reports'

/**
 * The DSA Art. 16 moderation queue.
 *
 * Every test owns the comment and the report it acts on — `fullyParallel`
 * means a sibling test is deciding on other rows at the same moment.
 */

test('a report appears in the queue with its notice details', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/reports', /\/manage\/reports/)
    const commentId = await createComment(page, `${testPrefix}-reported`)
    const reportId = await createReport(page, {
        contentId: commentId,
        explanation: `${testPrefix}-explanation`,
    })

    await gotoSettled(page, '/manage/reports')

    const card = page.getByTestId(`report-card-${reportId}`)
    await expect(card).toBeVisible()
    await expect(card).toContainText(`${testPrefix}-explanation`)
    // The server-stamped snapshot, not anything the reporter supplied.
    await expect(card).toContainText(`${testPrefix}-reported`)
    await expect(card.getByTestId('report-card-status')).toContainText(/open/i)

    await deleteReport(page, reportId)
    await deleteComment(page, commentId)
})

test('removing content deletes the comment and records the decision', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/reports', /\/manage\/reports/)
    const commentId = await createComment(page, `${testPrefix}-remove-me`)
    const reportId = await createReport(page, {
        contentId: commentId,
        explanation: `${testPrefix}-remove`,
    })

    await gotoSettled(page, '/manage/reports')

    const card = page.getByTestId(`report-card-${reportId}`)
    await card.getByTestId('report-card-remove').click()
    await page
        .getByTestId('report-decision-reason')
        .locator('textarea')
        .first()
        .fill('Breaches the rules, removed.')
    await page.getByTestId('report-decision-confirm').click()

    await expect(page.getByTestId('report-decision-dialog')).toBeHidden()
    await expect(card.getByTestId('report-card-status')).toContainText(
        /actioned/i,
    )

    // The comment itself is gone.
    const headers = await authHeader(page)
    const res = await page.request.get(
        `/api/collections/ratings/records/${commentId}`,
        { headers },
    )
    expect(res.status()).toBe(404)

    await deleteReport(page, reportId)
})

test('keeping content records a rejection and leaves the comment in place', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/reports', /\/manage\/reports/)
    const commentId = await createComment(page, `${testPrefix}-keep-me`)
    const reportId = await createReport(page, {
        contentId: commentId,
        explanation: `${testPrefix}-keep`,
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
    await expect(card.getByTestId('report-card-status')).toContainText(
        /rejected/i,
    )

    const headers = await authHeader(page)
    const res = await page.request.get(
        `/api/collections/ratings/records/${commentId}`,
        { headers },
    )
    expect(res.status()).toBe(200)

    await deleteReport(page, reportId)
    await deleteComment(page, commentId)
})

// The e2e stack ships no mail server, so this is the state a fresh install is
// in — and the operator has to be told the Art. 16 notices aren't going out.
test('the queue warns when email is not configured', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/reports', /\/manage\/reports/)

    const warning = page.getByTestId('reports-mail-warning')
    await expect(warning).toBeVisible()
    await expect(
        page.getByTestId('reports-mail-warning-link'),
    ).toHaveAttribute('href', /\/admin\/settings/)
})

test('a user without manage_reports cannot reach the queue or its records', async ({
    userPage: page,
}) => {
    await gotoSettled(page, '/manage/reports')
    await page.waitForURL((url) => !url.pathname.endsWith('/manage/reports'))

    // The route guard is a UI affordance; the collection rule is the real gate.
    const headers = await authHeader(page)
    const res = await page.request.get('/api/collections/reports/records', {
        headers,
    })
    const body = await res.json()
    // A list rule filters rows rather than refusing outright, so "denied" here
    // means the queue is empty for this user, not that the request failed.
    expect(body.totalItems).toBe(0)
})
