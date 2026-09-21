import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'
import { createComment, deleteComment } from '../../support/comments'

/**
 * Every test here owns the comment it acts on. Reaching for `.first()` in the
 * shared seeded list raced the other tests in this file — they run in parallel
 * and delete or edit that same card.
 */

test('shows seeded review stats and deletes a comment', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/comments')
    await expect(page.getByTestId('comments-stat-total')).toBeVisible()

    const id = await createComment(page, `${testPrefix}-to-delete`)
    await gotoSettled(page, '/manage/comments')

    const card = page.getByTestId(`comment-card-${id}`)
    await expect(card).toBeVisible()
    await card.getByTestId('comment-card-delete').click()
    await page.getByTestId('confirm-dialog-confirm').click()

    await expect(page.getByTestId('global-snackbar')).toBeVisible()
    await expect(card).toHaveCount(0)
})

test('cancelling delete keeps the comment', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/comments')
    const id = await createComment(page, `${testPrefix}-survives-cancel`)
    await gotoSettled(page, '/manage/comments')

    const card = page.getByTestId(`comment-card-${id}`)
    await expect(card).toBeVisible()

    await card.getByTestId('comment-card-delete').click()
    await expect(page.getByTestId('confirm-dialog')).toBeVisible()
    await page.getByTestId('confirm-dialog-cancel').click()
    await expect(page.getByTestId('confirm-dialog')).toBeHidden()

    await expect(card).toBeVisible()

    await deleteComment(page, id)
})

test('edits a comment', async ({ adminPage: page, testPrefix }) => {
    await gotoSettled(page, '/manage/comments')
    const id = await createComment(page, `${testPrefix}-before-edit`)
    await gotoSettled(page, '/manage/comments')

    const card = page.getByTestId(`comment-card-${id}`)
    await expect(card).toBeVisible()
    await card.getByTestId('comment-card-edit').click()

    await expect(page.getByTestId('review-form-dialog')).toBeVisible()
    const newComment = `${testPrefix}-edited-comment`
    await page
        .getByTestId('review-form-comment')
        .getByRole('textbox')
        .fill(newComment)
    await page.getByTestId('review-form-submit').click()

    await expect(page.getByTestId('review-form-dialog')).toBeHidden()
    await expect(page.getByTestId('global-snackbar')).toBeVisible()
    await expect(card).toContainText(newComment)

    await deleteComment(page, id)
})

test('filters comments by star rating', async ({ adminPage: page }) => {
    await gotoSettled(page, '/manage/comments')
    await page.getByTestId('comments-filter-rating-5').click()
    await expect(page.getByTestId('comments-filter-rating-5')).toHaveClass(
        /v-chip--selected/,
    )
})

test('shows an error and keeps the comment when delete fails', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/comments')
    const id = await createComment(page, `${testPrefix}-delete-fails`)
    await gotoSettled(page, '/manage/comments')

    const card = page.getByTestId(`comment-card-${id}`)
    await expect(card).toBeVisible()

    await page.route('**/api/collections/ratings/records/**', (route) =>
        route.abort('failed'),
    )

    await card.getByTestId('comment-card-delete').click()
    await page.getByTestId('confirm-dialog-confirm').click()

    await expect(page.getByTestId('global-snackbar')).toBeVisible()
    await expect(card).toBeVisible()

    // Lift the abort before cleaning up, or the cleanup delete fails too.
    await page.unroute('**/api/collections/ratings/records/**')
    await deleteComment(page, id)
})

test('a user without manage_comments is redirected away from /manage/comments', async ({
    userPage: page,
}) => {
    await gotoSettled(page, '/manage/comments')
    await page.waitForURL((url) => !url.pathname.endsWith('/manage/comments'))

    const headers = await authHeader(page)
    const res = await page.request.delete(
        '/api/collections/ratings/records/nonexistent',
        { headers },
    )
    expect(res.status()).toBeGreaterThanOrEqual(400)
})
