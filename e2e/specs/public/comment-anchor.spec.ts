import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import {
    createComment,
    deleteComment,
    firstRouteId,
} from '../../support/comments'

test('scrolls to and highlights the comment a report links to', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/routes', /\/manage\/routes/)
    const routeId = await firstRouteId(page)
    const commentId = await createComment(page, `${testPrefix}-anchored`)

    await gotoSettled(page, `/route?id=${routeId}#comment-${commentId}`)

    const card = page.locator(`#comment-${commentId}`)
    await expect(card).toBeVisible()
    await expect(card).toHaveClass(/comment-card--target/)
    await expect(card).toBeInViewport()

    await deleteComment(page, commentId)
})

test('leaves the list alone when there is no anchor', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/routes', /\/manage\/routes/)
    const routeId = await firstRouteId(page)
    const commentId = await createComment(page, `${testPrefix}-unanchored`)

    await gotoSettled(page, `/route?id=${routeId}`)

    await expect(page.locator(`#comment-${commentId}`)).not.toHaveClass(
        /comment-card--target/,
    )

    await deleteComment(page, commentId)
})
