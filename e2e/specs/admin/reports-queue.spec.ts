import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'
import { createComment } from '../../support/comments'
import { createReport } from '../../support/reports'

test('a report appears in the queue with its notice details', async ({
    adminPage: page,
    route,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/reports', /\/manage\/reports/)
    const commentId = await createComment(
        page,
        route.id,
        `${testPrefix}-reported`,
    )
    const reportId = await createReport(page, {
        contentId: commentId,
        explanation: `${testPrefix}-explanation`,
    })

    await gotoSettled(page, '/manage/reports')

    const card = page.getByTestId(`report-card-${reportId}`)
    await expect(card).toBeVisible()
    await expect(card).toContainText(`${testPrefix}-explanation`)
    await expect(card).toContainText(`${testPrefix}-reported`)
    await expect(card.getByTestId('report-card-status')).toContainText(/open/i)
})

test('removing content deletes the comment and records the decision', async ({
    adminPage: page,
    route,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/reports', /\/manage\/reports/)
    const commentId = await createComment(
        page,
        route.id,
        `${testPrefix}-remove-me`,
    )
    const reportId = await createReport(page, {
        contentId: commentId,
        explanation: `${testPrefix}-remove`,
    })

    await gotoSettled(page, '/manage/reports')

    const card = page.getByTestId(`report-card-${reportId}`)
    await card.getByTestId('report-card-remove').click()
    await page
        .getByTestId('report-decision-reason')
        .first()
        .fill('Breaches the rules, removed.')
    await page.getByTestId('report-decision-confirm').click()

    await expect(page.getByTestId('report-decision-dialog')).toBeHidden()
    await expect(card.getByTestId('report-card-status')).toContainText(
        /actioned/i,
    )

    const headers = await authHeader(page)
    const res = await page.request.get(
        `/api/collections/ratings/records/${commentId}`,
        { headers },
    )
    expect(res.status()).toBe(404)
})

test('keeping content records a rejection and leaves the comment in place', async ({
    adminPage: page,
    route,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/reports', /\/manage\/reports/)
    const commentId = await createComment(
        page,
        route.id,
        `${testPrefix}-keep-me`,
    )
    const reportId = await createReport(page, {
        contentId: commentId,
        explanation: `${testPrefix}-keep`,
    })

    await gotoSettled(page, '/manage/reports')

    const card = page.getByTestId(`report-card-${reportId}`)
    await card.getByTestId('report-card-keep').click()
    await page
        .getByTestId('report-decision-reason')
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
})

test('the queue shows no mail warning once SMTP is configured', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/reports', /\/manage\/reports/)

    await expect(page.getByTestId('reports-mail-warning')).toBeHidden()
})

test('a user without manage_reports cannot reach the queue or its records', async ({
    userPage: page,
}) => {
    await gotoSettled(page, '/manage/reports')
    await page.waitForURL((url) => !url.pathname.endsWith('/manage/reports'))

    const headers = await authHeader(page)
    const res = await page.request.get('/api/collections/reports/records', {
        headers,
    })
    const body = await res.json()
    expect(body.totalItems).toBe(0)
})

test('shows skeleton cards while the queue reloads', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/reports')
    let release!: () => void
    const held = new Promise<void>((resolve) => (release = resolve))
    await page.route('**/api/collections/reports/records*', async (route) => {
        await held
        await route.continue()
    })

    await page.getByTestId('filter-search').fill('skeleton')
    await expect(page.getByTestId('reports-skeleton').first()).toBeVisible()

    release()
    await expect(page.getByTestId('reports-skeleton')).toHaveCount(0)
})
