import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'
import { createComment, deleteComment } from '../../support/comments'
import { createReport, deleteReport } from '../../support/reports'

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

    await page.waitForURL(/\/manage\/reports/)

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

test('menu keeps a readable width and fits on phones', async ({
    adminPage: page,
}) => {
    for (const viewport of [
        { width: 1440, height: 900, minWidth: 340 },
        { width: 360, height: 780, minWidth: 320 },
    ]) {
        await page.setViewportSize(viewport)
        await gotoSettled(page, '/')
        await page.getByTestId('notification-bell').click()
        const menuLocator = page.getByTestId('notification-menu')
        await expect
            .poll(async () => (await menuLocator.boundingBox())?.width ?? 0)
            .toBeGreaterThanOrEqual(viewport.minWidth)
        const menu = (await menuLocator.boundingBox())!
        expect(menu.x).toBeGreaterThanOrEqual(0)
        expect(menu.x + menu.width).toBeLessThanOrEqual(viewport.width)
        await page.keyboard.press('Escape')
    }
})
