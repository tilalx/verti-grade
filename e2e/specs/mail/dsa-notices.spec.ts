import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { createComment, deleteComment } from '../../support/comments'
import { createReport, deleteReport } from '../../support/reports'
import { waitForMail, mailCount, mailbox } from '../../support/mail'

/**
 * DSA Art. 16(4) and 16(5).
 *
 * 16(5) — the decision notice — had never once been sent: the hook guarded on
 * `record.get('notified_at')`, and PocketBase returns a DateTime OBJECT for an
 * unset date, which is truthy in JS. Every report therefore looked "already
 * notified" and the send was skipped, while the receipt mail promised the
 * notifier they would hear the outcome. Nothing caught it because there was no
 * mail catcher in the harness.
 */

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
    expect(receipt.HTML).toContain(`${testPrefix}-receipt-explanation`)
    // Art. 16(2)(b): the notice carries the exact location of the content.
    expect(receipt.HTML).toContain(commentId)

    // The moderator alert goes to every manage_reports holder; admin is one.
    // Pinned by body, since siblings are filing reports into the same inbox.
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
    // Art. 16(5) also requires the redress information.
    expect(decision.HTML).toMatch(/out-of-court|dispute settlement/i)

    // The hook re-saves the record to stamp notified_at, which re-enters the
    // update hook -- the notice must not go out twice.
    expect(await mailCount(page, notifier)).toBe(2)

    await deleteReport(page, reportId)
    await deleteComment(page, commentId)
})
