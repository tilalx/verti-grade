import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { createComment, deleteComment } from '../../support/comments'

test('changing the route filter clears the selection', async ({
    adminPage: page,
    createRoute,
    testPrefix,
}) => {
    for (const name of [
        `${testPrefix}-a-0`,
        `${testPrefix}-a-1`,
        `${testPrefix}-b-0`,
    ]) {
        await createRoute({ name })
    }

    await gotoSettled(page, '/manage/routes')
    const search = page.getByTestId('filter-search').locator('input')
    const selectAll = page.getByTestId('routes-select-all')

    await search.fill(`${testPrefix}-a`)
    await expect(page.getByTestId('routes-row-name')).toHaveCount(2)
    await selectAll.click()
    await expect(selectAll).toHaveText('2 selected')

    await search.fill(`${testPrefix}-b`)
    await expect(page.getByTestId('routes-row-name')).toHaveCount(1)
    await expect(selectAll).toHaveText('Select all')
    await expect(page.getByTestId('routes-archive-selected')).toHaveCount(0)

    await selectAll.click()
    await expect(selectAll).toHaveText('1 selected')
    await expect(selectAll).toHaveAttribute('title', 'Deselect all')
})

test('changing a comment filter clears the selection', async ({
    adminPage: page,
    route,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/comments')
    const id = await createComment(page, route.id, `${testPrefix}-selected`, 5)
    await gotoSettled(page, `/manage/comments?search=${testPrefix}`)

    const card = page.getByTestId(`comment-card-${id}`)
    await card.getByTestId('comment-card-checkbox').locator('input').click()
    await expect(page.getByTestId('comments-bulk-delete')).toBeVisible()

    await page.getByTestId('comments-filter-rating-1').click()
    await expect(page.getByTestId('comments-bulk-delete')).toHaveCount(0)
})

test('a comment deleted elsewhere drops out of the selection', async ({
    adminPage: page,
    route,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/comments')
    const id = await createComment(page, route.id, `${testPrefix}-gone`, 5)
    await gotoSettled(page, `/manage/comments?search=${testPrefix}`)

    const card = page.getByTestId(`comment-card-${id}`)
    await card.getByTestId('comment-card-checkbox').locator('input').click()
    await expect(page.getByTestId('comments-bulk-delete')).toBeVisible()

    await deleteComment(page, id)

    await expect(card).toHaveCount(0)
    await expect(page.getByTestId('comments-bulk-delete')).toHaveCount(0)
})
