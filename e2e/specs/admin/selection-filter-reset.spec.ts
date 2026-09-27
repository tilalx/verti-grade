import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'
import { LOCATIONS, locationId, uiaa } from '../../support/seed'
import { createComment, deleteComment } from '../../support/comments'

test('changing the route filter clears the selection', async ({
    adminPage: page,
}) => {
    const prefix = `e2e-select-reset-${Date.now()}`

    await gotoSettled(page, '/manage/routes')
    const headers = await authHeader(page)
    const hallA = await locationId(page, LOCATIONS[0])

    for (const name of [`${prefix}-a-0`, `${prefix}-a-1`, `${prefix}-b-0`]) {
        await page.request.post('/api/collections/routes/records', {
            headers,
            data: {
                name,
                ...uiaa('5'),
                anchor_point: 5,
                location: hallA,
                type: 'Route',
                creator: ['E2E'],
                screw_date: '2026-01-01',
                archived: false,
            },
        })
    }

    await gotoSettled(page, '/manage/routes')
    const search = page.getByTestId('filter-search').locator('input')
    const selectAll = page.getByTestId('routes-select-all')

    await search.fill(`${prefix}-a`)
    await expect(page.getByTestId('routes-table')).toContainText(
        `${prefix}-a-1`,
    )
    await selectAll.click()
    await expect(selectAll).toHaveText('2 selected')

    await search.fill(`${prefix}-b`)
    await expect(page.getByTestId('routes-table')).toContainText(
        `${prefix}-b-0`,
    )
    await expect(selectAll).toHaveText('Select all')
    await expect(page.getByTestId('routes-archive-selected')).toHaveCount(0)

    await selectAll.click()
    await expect(selectAll).toHaveText('1 selected')
    await expect(selectAll).toHaveAttribute('title', 'Deselect all')
})

test('changing a comment filter clears the selection', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/comments')
    const id = await createComment(page, `${testPrefix}-selected`, 5)
    await gotoSettled(page, '/manage/comments')

    const card = page.getByTestId(`comment-card-${id}`)
    await card.getByTestId('comment-card-checkbox').locator('input').click()
    await expect(page.getByTestId('comments-bulk-delete')).toBeVisible()

    await page.getByTestId('comments-filter-rating-1').click()
    await expect(page.getByTestId('comments-bulk-delete')).toHaveCount(0)

    await deleteComment(page, id)
})

test('a comment deleted elsewhere drops out of the selection', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/comments')
    const id = await createComment(page, `${testPrefix}-gone`, 5)
    await gotoSettled(page, '/manage/comments')

    const card = page.getByTestId(`comment-card-${id}`)
    await card.getByTestId('comment-card-checkbox').locator('input').click()
    await expect(page.getByTestId('comments-bulk-delete')).toBeVisible()

    await deleteComment(page, id)

    await expect(card).toHaveCount(0)
    await expect(page.getByTestId('comments-bulk-delete')).toHaveCount(0)
})
