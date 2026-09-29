import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { PB_URL } from '../../support/map'
import { authAsSuperuser, ensureLocations, uiaa } from '../../support/seed'

const REVIEW_COUNT = 60

test('loading more after deletes still reaches every review', async ({
    adminPage: page,
    testPrefix,
}) => {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const locations = await ensureLocations(root)
    const route = await root.collection('routes').create({
        name: `${testPrefix}-paging`,
        ...uiaa('5'),
        location: locations['Hall A'],
        type: 'Route',
        creator: ['E2E'],
    })
    try {
        const ratingIds: string[] = []
        for (let index = 0; index < REVIEW_COUNT; index++) {
            const rating = await root.collection('ratings').create({
                route_id: route.id,
                rating: 3,
                ...uiaa('5'),
                comment: `${testPrefix} paging ${index}`,
            })
            ratingIds.push(rating.id)
        }

        await gotoSettled(page, '/manage/comments')
        await page
            .getByTestId('filter-search')
            .locator('input')
            .fill(testPrefix)
        const showing = page.getByTestId('comments-showing')
        await expect(showing).toHaveText('Showing 48 of 60 reviews')

        for (const id of ratingIds.slice(-3)) {
            await root.collection('ratings').delete(id)
        }
        await expect(showing).toHaveText('Showing 45 of 57 reviews')

        await showing.scrollIntoViewIfNeeded()
        await expect(showing).toHaveText('Showing 57 of 57 reviews')
    } finally {
        await root.collection('routes').delete(route.id)
    }
})
