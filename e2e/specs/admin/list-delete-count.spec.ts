import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { authAsSuperuser, ensureUser, getRoleIds } from '../../support/seed'
import { gotoSettled } from '../../support/nav'
import { createComment, deleteComment } from '../../support/comments'

test('deleting a comment lowers the total by exactly one', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/comments')
    const keptId = await createComment(page, `${testPrefix}-count-kept`)
    const deletedId = await createComment(page, `${testPrefix}-count-deleted`)
    await gotoSettled(page, '/manage/comments')

    await page.getByTestId('filter-search').locator('input').fill(testPrefix)
    const showing = page.getByTestId('comments-showing')
    await expect(showing).toHaveText('Showing 2 of 2 reviews')

    await page
        .getByTestId(`comment-card-${deletedId}`)
        .getByTestId('comment-card-delete')
        .click()
    await page.getByTestId('confirm-dialog-confirm').click()

    await expect(page.getByTestId(`comment-card-${deletedId}`)).toHaveCount(0)
    await expect(showing).toHaveText('Showing 1 of 1 reviews')

    await deleteComment(page, keptId)
})

test('a realtime comment outside the active filter is not inserted', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/comments')
    await page.getByTestId('filter-search').locator('input').fill(testPrefix)
    await page.getByTestId('comments-filter-rating-1').click()

    const hiddenId = await createComment(page, `${testPrefix}-five-stars`, 5)
    const visibleId = await createComment(page, `${testPrefix}-one-star`, 1)

    await expect(page.getByTestId(`comment-card-${visibleId}`)).toBeVisible()
    await expect(page.getByTestId(`comment-card-${hiddenId}`)).toHaveCount(0)
    await expect(page.getByTestId('comments-showing')).toHaveText(
        'Showing 1 of 1 reviews',
    )

    await deleteComment(page, hiddenId)
    await deleteComment(page, visibleId)
})

test('creating and deleting users keeps the user total exact', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/users')
    const suffix = `count${Date.now()}`

    for (const index of [0, 1]) {
        await page.getByTestId('user-create-open').click()
        await expect(page.getByTestId('user-create-dialog')).toBeVisible()
        await page
            .getByTestId('user-create-firstname')
            .locator('input')
            .fill('E2E')
        await page
            .getByTestId('user-create-lastname')
            .locator('input')
            .fill(`${suffix}${index}`)
        await page
            .getByTestId('user-create-email')
            .locator('input')
            .fill(`e2e-${suffix}-${index}@gripello.test`)
        await page.getByTestId('user-create-submit').click()
        await expect(page.getByTestId('user-create-dialog')).toBeHidden()
    }

    await page.getByTestId('filter-search').locator('input').fill(suffix)
    const cards = page.locator('[data-testid^="user-card-"]').filter({
        hasText: suffix,
    })
    await expect(cards).toHaveCount(2)
    await expect(page.getByTestId('users-showing')).toHaveText(
        'Showing 2 of 2 users',
    )

    await cards.first().getByTestId('user-card-delete').click()
    await page.getByTestId('confirm-dialog-confirm').click()

    await expect(cards).toHaveCount(1)
    await expect(page.getByTestId('users-showing')).toHaveText(
        'Showing 1 of 1 users',
    )

    await cards.first().getByTestId('user-card-delete').click()
    await page.getByTestId('confirm-dialog-confirm').click()
    await expect(cards).toHaveCount(0)
})

test('a realtime comment under a non-date sort refetches instead of inflating the total', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/comments')
    await page.getByTestId('filter-search').locator('input').fill(testPrefix)
    await page.getByTestId('comments-sort').click()
    await page.getByRole('option', { name: 'Most stars' }).click()

    const lowId = await createComment(page, `${testPrefix}-sort-low`, 2)
    const highId = await createComment(page, `${testPrefix}-sort-high`, 5)

    const cards = page.locator('.comment-card').filter({ hasText: testPrefix })
    await expect(page.getByTestId(`comment-card-${highId}`)).toBeVisible()
    await expect(page.getByTestId(`comment-card-${lowId}`)).toBeVisible()
    await expect(page.getByTestId('comments-showing')).toHaveText(
        'Showing 2 of 2 reviews',
    )
    await expect(cards.first()).toContainText(`${testPrefix}-sort-high`)

    await deleteComment(page, lowId)
    await deleteComment(page, highId)
})

test('a realtime user resolved after the search changed is not inserted', async ({
    adminPage: page,
    testPrefix,
}) => {
    const root = new PocketBase(process.env.E2E_PB_URL || 'https://localhost')
    await authAsSuperuser(root)
    const roleIds = await getRoleIds(root)

    await gotoSettled(page, '/admin/users')
    const search = page.getByTestId('filter-search').locator('input')
    await search.fill(`${testPrefix}-late`)

    await page.route('**/api/collections/users/records?*', async (route) => {
        if (new URL(route.request().url()).searchParams.get('perPage') === '1')
            await new Promise((resolve) => setTimeout(resolve, 1500))
        await route.continue()
    })
    const realtimeLookup = page.waitForResponse(
        (response) =>
            response.url().includes('/api/collections/users/records') &&
            new URL(response.url()).searchParams.get('perPage') === '1',
    )

    const user = await ensureUser(
        root,
        roleIds.user,
        'user',
        `${testPrefix}-late`,
    )
    try {
        await search.fill(`${testPrefix}-other`)
        await realtimeLookup
        await expect(page.getByTestId(`user-card-${user.id}`)).toHaveCount(0)
    } finally {
        await root
            .collection('users')
            .delete(user.id)
            .catch(() => {})
    }
})
