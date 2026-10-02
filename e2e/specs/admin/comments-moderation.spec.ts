import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'
import { createComment } from '../../support/comments'

test('shows seeded review stats and deletes a comment', async ({
    adminPage: page,
    testPrefix,
    route,
}) => {
    await gotoSettled(page, '/manage/comments')
    await expect(page.getByTestId('comments-stat-total')).toBeVisible()

    const id = await createComment(page, route.id, `${testPrefix}-to-delete`)
    await gotoSettled(page, '/manage/comments')

    const card = page.getByTestId(`comment-card-${id}`)
    await expect(card).toBeVisible()
    await card.getByTestId('comment-card-delete').click()
    await page.getByTestId('confirm-dialog-confirm').click()

    await expect(page.getByTestId('global-snackbar').last()).toBeVisible()
    await expect(card).toHaveCount(0)
})

test('cancelling delete keeps the comment', async ({
    adminPage: page,
    testPrefix,
    route,
}) => {
    await gotoSettled(page, '/manage/comments')
    const id = await createComment(
        page,
        route.id,
        `${testPrefix}-survives-cancel`,
    )
    await gotoSettled(page, '/manage/comments')

    const card = page.getByTestId(`comment-card-${id}`)
    await expect(card).toBeVisible()

    await card.getByTestId('comment-card-delete').click()
    await expect(page.getByTestId('confirm-dialog')).toBeVisible()
    await page.getByTestId('confirm-dialog-cancel').click()
    await expect(page.getByTestId('confirm-dialog')).toBeHidden()

    await expect(card).toBeVisible()
})

test('edits a comment', async ({ adminPage: page, testPrefix, route }) => {
    await gotoSettled(page, '/manage/comments')
    const id = await createComment(page, route.id, `${testPrefix}-before-edit`)
    await gotoSettled(page, '/manage/comments')

    const card = page.getByTestId(`comment-card-${id}`)
    await expect(card).toBeVisible()
    await card.getByTestId('comment-card-edit').click()

    await expect(page.getByTestId('review-form-dialog')).toBeVisible()
    const newComment = `${testPrefix}-edited-comment`
    await page.getByTestId('review-form-comment').fill(newComment)
    await page.getByTestId('review-form-submit').click()

    await expect(page.getByTestId('review-form-dialog')).toBeHidden()
    await expect(page.getByTestId('global-snackbar').last()).toBeVisible()
    await expect(card).toContainText(newComment)
})

test('filters comments by star rating', async ({ adminPage: page }) => {
    await gotoSettled(page, '/manage/comments')
    await page.getByTestId('comments-filter-rating-5').click()
    await expect(page.getByTestId('comments-filter-rating-5')).toHaveAttribute(
        'aria-pressed',
        'true',
    )
})

test('shows an error and keeps the comment when delete fails', async ({
    adminPage: page,
    testPrefix,
    route,
}) => {
    await gotoSettled(page, '/manage/comments')
    const id = await createComment(page, route.id, `${testPrefix}-delete-fails`)
    await gotoSettled(page, '/manage/comments')

    const card = page.getByTestId(`comment-card-${id}`)
    await expect(card).toBeVisible()

    await page.route('**/api/collections/ratings/records/**', (request) =>
        request.abort('failed'),
    )

    await card.getByTestId('comment-card-delete').click()
    await page.getByTestId('confirm-dialog-confirm').click()

    await expect(page.getByTestId('global-snackbar').last()).toBeVisible()
    await expect(card).toBeVisible()
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
