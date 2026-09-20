import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

const LONG_COMMENT = 'Sehr schoene Route, wirklich lang. '.repeat(20)

test('show more expands a clipped comment', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/admin/comments')

    const firstCard = page.locator('[data-testid^="comment-card-"]').first()
    await expect(firstCard).toBeVisible()
    await firstCard.getByTestId('comment-card-edit').click()

    await expect(page.getByTestId('review-form-dialog')).toBeVisible()
    await page
        .getByTestId('review-form-comment')
        .getByRole('textbox')
        .fill(`${testPrefix} ${LONG_COMMENT}`)
    await page.getByTestId('review-form-submit').click()
    await expect(page.getByTestId('review-form-dialog')).toBeHidden()

    await gotoSettled(page, '/admin/comments')
    // Pin to the card we just edited: the list is sorted by creation date, so
    // "first" is only incidentally the one carrying our text.
    const card = page
        .locator('[data-testid^="comment-card-"]')
        .filter({ hasText: testPrefix })
        .first()
    await expect(card).toBeVisible()
    const text = card.locator('.comment-card__comment')
    const toggle = card.getByTestId('comment-card-toggle')

    await expect(toggle).toBeVisible()
    const clipped = await text.evaluate((el) => ({
        client: el.clientHeight,
        scroll: el.scrollHeight,
    }))
    expect(clipped.scroll).toBeGreaterThan(clipped.client)

    await toggle.click()
    await expect
        .poll(async () =>
            text.evaluate((el) => el.scrollHeight - el.clientHeight),
        )
        .toBeLessThanOrEqual(1)
})

test('short comments have no show more button', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/admin/comments')

    const firstCard = page.locator('[data-testid^="comment-card-"]').first()
    await expect(firstCard).toBeVisible()
    await firstCard.getByTestId('comment-card-edit').click()

    await expect(page.getByTestId('review-form-dialog')).toBeVisible()
    await page
        .getByTestId('review-form-comment')
        .getByRole('textbox')
        .fill(`${testPrefix} kurz`)
    await page.getByTestId('review-form-submit').click()
    await expect(page.getByTestId('review-form-dialog')).toBeHidden()

    await gotoSettled(page, '/admin/comments')
    const card = page
        .locator('[data-testid^="comment-card-"]')
        .filter({ hasText: testPrefix })
        .first()
    await expect(card).toContainText('kurz')
    await expect(card.getByTestId('comment-card-toggle')).toHaveCount(0)
})
