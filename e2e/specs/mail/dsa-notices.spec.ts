import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { createComment, deleteComment } from '../../support/comments'
import { createReport, deleteReport } from '../../support/reports'
import { waitForMail, mailCount, mailbox } from '../../support/mail'

test('Art. 16(4): the notifier gets a receipt and moderators get an alert', async ({
    adminPage: page,
    testPrefix,
}) => {
    const notifier = mailbox(testPrefix, 'notifier')

    await gotoSettled(page, '/manage/reports', /\/manage\/reports/)
    const commentId = await createComment(page, `${testPrefix}-receipt`)
    const reportId = await createReport(page, {
        contentId: commentId,
        explanation: `${testPrefix}-receipt-explanation`,
        notifierEmail: notifier,
    })

    const receipt = await waitForMail(page, notifier, { subject: /received/i })
    expect(receipt.HTML).not.toContain(`${testPrefix}-receipt-explanation`)
    expect(receipt.HTML).toContain(reportId)

    const alert = await waitForMail(page, 'e2e-admin@verti-grade.test', {
        subject: /new content report/i,
        bodyIncludes: `${testPrefix}-receipt-explanation`,
    })
    expect(alert.HTML).toContain('/manage/reports')

    await deleteReport(page, reportId)
    await deleteComment(page, commentId)
})

test('Art. 16(5): the notifier is told the decision, exactly once', async ({
    adminPage: page,
    testPrefix,
}) => {
    const notifier = mailbox(testPrefix, 'decision')

    await gotoSettled(page, '/manage/reports', /\/manage\/reports/)
    const commentId = await createComment(page, `${testPrefix}-decide`)
    const reportId = await createReport(page, {
        contentId: commentId,
        explanation: `${testPrefix}-decide-explanation`,
        notifierEmail: notifier,
    })

    await waitForMail(page, notifier, { subject: /received/i })

    await gotoSettled(page, '/manage/reports')
    const card = page.getByTestId(`report-card-${reportId}`)
    await card.getByTestId('report-card-keep').click()
    await page
        .getByTestId('report-decision-reason')
        .locator('textarea')
        .first()
        .fill(`${testPrefix}-reasoning`)
    await page.getByTestId('report-decision-confirm').click()
    await expect(page.getByTestId('report-decision-dialog')).toBeHidden()

    const decision = await waitForMail(page, notifier, {
        subject: /decision/i,
    })
    expect(decision.HTML).toContain(`${testPrefix}-reasoning`)
    expect(decision.HTML).toMatch(/out-of-court|dispute settlement/i)

    expect(await mailCount(page, notifier)).toBe(2)

    await deleteReport(page, reportId)
    await deleteComment(page, commentId)
})
