import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { createComment } from '../../support/comments'

test('edit review dialog puts stars and difficulty on one row', async ({
    adminPage: page,
    route,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/routes')
    const id = await createComment(page, route.id, `${testPrefix}-review`)
    await gotoSettled(page, `/manage/comments?search=${testPrefix}`)

    const card = page.getByTestId(`comment-card-${id}`)
    await expect(card).toBeVisible()
    await card.getByTestId('comment-card-edit').click()

    const dialog = page.getByTestId('review-form-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByTestId('dialog-close')).toBeVisible()

    const rating = page.getByTestId('review-form-rating')
    const difficulty = page.getByTestId('review-form-difficulty')
    const center = (b: { y: number; height: number }) => b.y + b.height / 2

    await expect
        .poll(async () => {
            const [ratingBox, difficultyBox] = [
                (await rating.boundingBox())!,
                (await difficulty.boundingBox())!,
            ]
            return (
                difficultyBox.x > ratingBox.x + ratingBox.width &&
                difficultyBox.y < ratingBox.y + ratingBox.height &&
                Math.abs(center(ratingBox) - center(difficultyBox)) < 8
            )
        })
        .toBe(true)

    const viewport = page.viewportSize()!
    await expect
        .poll(async () => {
            const box = (await dialog.boundingBox())!
            return viewport.height - (box.y + box.height)
        })
        .toBeGreaterThan(24)
})
