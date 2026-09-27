import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { createComment, deleteComment } from '../../support/comments'

test('the week filter sends a PocketBase-formatted cutoff and keeps new comments', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/comments')
    const id = await createComment(page, `${testPrefix}-this-week`)
    await gotoSettled(page, '/manage/comments')
    await page.getByTestId('filter-search').locator('input').fill(testPrefix)

    const filterRequest = page.waitForRequest((request) => {
        const url = new URL(request.url())
        return (
            url.pathname === '/api/collections/ratings/records' &&
            (url.searchParams.get('filter') ?? '').includes('created >=')
        )
    })
    await page
        .getByTestId('comments-filter-date')
        .getByRole('button', { name: 'This week' })
        .click()

    const filter = new URL((await filterRequest).url()).searchParams.get(
        'filter',
    )
    expect(filter).toMatch(/created >= "\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)
    expect(filter).not.toMatch(/created >= "[^"]*T/)
    await expect(page.getByTestId(`comment-card-${id}`)).toBeVisible()

    await deleteComment(page, id)
})
