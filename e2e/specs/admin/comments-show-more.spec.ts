import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { createComment, deleteComment } from '../../support/comments'

const LONG_COMMENT = 'Sehr schoene Route, wirklich lang. '.repeat(20)

/**
 * The clamp is about comment length, so each test creates a comment of the
 * length it needs. Editing whichever card came first in the shared list raced
 * the moderation specs, which delete and edit that same card.
 */

test('show more expands a clipped comment', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/comments')
    const id = await createComment(page, `${testPrefix} ${LONG_COMMENT}`)
    await gotoSettled(page, '/manage/comments')

    const card = page.getByTestId(`comment-card-${id}`)
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

    await deleteComment(page, id)
})

test('short comments have no show more button', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/comments')
    const id = await createComment(page, `${testPrefix} kurz`)
    await gotoSettled(page, '/manage/comments')

    const card = page.getByTestId(`comment-card-${id}`)
    await expect(card).toContainText('kurz')
    await expect(card.getByTestId('comment-card-toggle')).toHaveCount(0)

    await deleteComment(page, id)
})
