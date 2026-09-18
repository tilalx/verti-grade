import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

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

test('filters comments by star rating', async ({ adminPage: page }) => {
    await gotoSettled(page, '/admin/comments')
    await page.getByTestId('comments-filter-rating-5').click()
    await expect(page.getByTestId('comments-filter-rating-5')).toHaveClass(
        /v-chip--selected/,
    )
})
