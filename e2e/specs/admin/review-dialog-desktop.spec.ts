import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('edit review dialog puts stars and difficulty on one row', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/comments')

    const firstCard = page.locator('[data-testid^="comment-card-"]').first()
    await expect(firstCard).toBeVisible()
    await firstCard.getByTestId('comment-card-edit').click()

    const dialog = page.getByTestId('review-form-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByTestId('dialog-close')).toBeVisible()

    const rating = await page.getByTestId('review-form-rating').boundingBox()
    const difficulty = await page
        .getByTestId('review-form-difficulty')
        .boundingBox()

    // Side by side, not stacked: difficulty starts right of the stars and
    // overlaps their vertical band.
    expect(difficulty!.x).toBeGreaterThan(rating!.x + rating!.width)
    expect(difficulty!.y).toBeLessThan(rating!.y + rating!.height)

    // ...and on the same middle line, not floating above or below it.
    const center = (b: { y: number; height: number }) => b.y + b.height / 2
    expect(Math.abs(center(rating!) - center(difficulty!))).toBeLessThan(8)

    // Centered dialog, not a bottom sheet pinned to the viewport floor.
    const box = (await dialog.boundingBox())!
    const viewport = page.viewportSize()!
    expect(viewport.height - (box.y + box.height)).toBeGreaterThan(24)
})
