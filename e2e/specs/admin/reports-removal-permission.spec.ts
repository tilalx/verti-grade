import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { signInAs } from '../../support/auth'
import { createComment, deleteComment } from '../../support/comments'
import { createReport, deleteReport } from '../../support/reports'
import { authAsSuperuser, ensureUser } from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'

test('a moderator without comment rights is not offered removal of a reported comment', async ({
    page,
    adminPage,
    testPrefix,
}) => {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const manageReports = await root
        .collection('permissions')
        .getFirstListItem(
            root.filter('name = {:name}', { name: 'manage_reports' }),
        )
    const role = await root.collection('roles').create({
        name: `${testPrefix}-reports-only`,
        permissions: [manageReports.id],
    })
    const moderator = await ensureUser(root, role.id, 'user', testPrefix)

    await gotoSettled(adminPage, '/')
    const commentId = await createComment(adminPage, `${testPrefix}-keep-me`)
    const reportId = await createReport(adminPage, {
        contentId: commentId,
        explanation: `${testPrefix}-report`,
    })

    try {
        await signInAs(page, moderator.email, moderator.password)
        await gotoSettled(page, '/manage/reports')
        const card = page.getByTestId(`report-card-${reportId}`)
        await expect(card.getByTestId('report-card-keep')).toBeVisible()
        await expect(card.getByTestId('report-card-remove')).toHaveCount(0)
        await expect(card.getByTestId('report-card-status')).toContainText(
            /open/i,
        )
        const comment = await adminPage.request.get(
            `/api/collections/ratings/records/${commentId}`,
        )
        expect(comment.status()).toBe(200)
    } finally {
        await deleteReport(adminPage, reportId)
        await deleteComment(adminPage, commentId)
        await root
            .collection('users')
            .delete(moderator.id)
            .catch(() => {})
        await root
            .collection('roles')
            .delete(role.id)
            .catch(() => {})
    }
})
