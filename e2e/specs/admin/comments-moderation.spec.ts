import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'

test('shows seeded review stats and deletes a comment', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/comments')
    await expect(page.getByTestId('comments-stat-total')).toBeVisible()

    const firstCard = page.locator('[data-testid^="comment-card-"]').first()
    await expect(firstCard).toBeVisible()
    await firstCard.getByTestId('comment-card-delete').click()
    await page.getByTestId('confirm-dialog-confirm').click()
    await expect(page.getByTestId('global-snackbar')).toBeVisible()
})

test('cancelling delete keeps the comment', async ({ adminPage: page }) => {
    await gotoSettled(page, '/admin/comments')

    const firstCard = page.locator('[data-testid^="comment-card-"]').first()
    await expect(firstCard).toBeVisible()
    const testId = await firstCard.getAttribute('data-testid')

    await firstCard.getByTestId('comment-card-delete').click()
    await expect(page.getByTestId('confirm-dialog')).toBeVisible()
    await page.getByTestId('confirm-dialog-cancel').click()
    await expect(page.getByTestId('confirm-dialog')).toBeHidden()

    await expect(page.getByTestId(testId!)).toBeVisible()
})

test('edits a comment', async ({ adminPage: page, testPrefix }) => {
    await gotoSettled(page, '/admin/comments')

    const firstCard = page.locator('[data-testid^="comment-card-"]').first()
    await expect(firstCard).toBeVisible()
    await firstCard.getByTestId('comment-card-edit').click()

    await expect(page.getByTestId('review-form-dialog')).toBeVisible()
    const newComment = `${testPrefix}-edited-comment`
    await page
        .getByTestId('review-form-comment')
        .locator('textarea')
        .fill(newComment)
    await page.getByTestId('review-form-submit').click()

    await expect(page.getByTestId('review-form-dialog')).toBeHidden()
    await expect(page.getByTestId('global-snackbar')).toBeVisible()
    await expect(firstCard).toContainText(newComment)
})

test('filters comments by star rating', async ({ adminPage: page }) => {
    await gotoSettled(page, '/admin/comments')
    await page.getByTestId('comments-filter-rating-5').click()
    await expect(page.getByTestId('comments-filter-rating-5')).toHaveClass(
        /v-chip--selected/,
    )
})

test('shows an error and keeps the comment when delete fails', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/comments')

    // .last() rather than .first(), so this doesn't race the other tests in
    // this file that grab the first card concurrently in other workers.
    const card = page.locator('[data-testid^="comment-card-"]').last()
    await expect(card).toBeVisible()
    const testId = await card.getAttribute('data-testid')

    await page.route('**/api/collections/ratings/records/**', (route) =>
        route.abort('failed'),
    )

    await card.getByTestId('comment-card-delete').click()
    await page.getByTestId('confirm-dialog-confirm').click()

    await expect(page.getByTestId('global-snackbar')).toBeVisible()
    await expect(page.getByTestId(testId!)).toBeVisible()
})

test('a user without manage_comments is redirected away from /admin/comments', async ({
    userPage: page,
}) => {
    await gotoSettled(page, '/admin/comments')
    await page.waitForURL((url) => !url.pathname.endsWith('/admin/comments'))

    const headers = await authHeader(page)
    const res = await page.request.delete(
        '/api/collections/ratings/records/nonexistent',
        { headers },
    )
    expect(res.status()).toBeGreaterThanOrEqual(400)
})
