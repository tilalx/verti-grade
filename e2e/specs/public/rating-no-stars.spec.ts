import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { PB_URL } from '../../support/map'
import { authAsSuperuser, ensureLocations, uiaa } from '../../support/seed'

async function seedRoute(prefix: string, stars: number[]) {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const locations = await ensureLocations(root)
    const route = await root.collection('routes').create({
        name: `${prefix}-stars`,
        ...uiaa('6'),
        anchor_point: 1,
        location: locations['Hall A'],
        type: 'Route',
        creator: ['E2E'],
        color: '#F44336',
        screw_date: new Date().toISOString().slice(0, 10),
    })
    for (const rating of stars) {
        await root.collection('ratings').create({
            route_id: route.id,
            rating,
            ...uiaa('6'),
            comment: `${prefix} ${rating} stars`,
        })
    }
    return {
        root,
        routeId: route.id,
        cleanup: () =>
            root
                .collection('routes')
                .delete(route.id)
                .catch(() => {}),
    }
}

test('a comment-only review does not pull down the average', async ({
    page,
    testPrefix,
}) => {
    const seeded = await seedRoute(testPrefix, [4, 0])
    try {
        const score = await seeded.root
            .collection('averageRating')
            .getOne(seeded.routeId)
        expect(score.average_rating).toBe(4)
        expect(score.ratings_count).toBe(1)

        await gotoSettled(page, `/route?id=${seeded.routeId}`)
        await expect(page.getByTestId('route-avg-rating')).toContainText('4')
        await expect(page.getByTestId('route-avg-rating')).not.toContainText(
            '2',
        )
    } finally {
        await seeded.cleanup()
    }
})

test('a new review cannot be submitted without stars', async ({
    page,
    testPrefix,
}) => {
    const seeded = await seedRoute(testPrefix, [])
    try {
        await gotoSettled(page, `/route?id=${seeded.routeId}`)
        await page.getByTestId('review-open-cta').click()
        await page.getByTestId('review-form-difficulty').click()
        await page.getByRole('option').first().click()
        await page
            .getByTestId('review-form-comment')
            .locator('textarea')
            .first()
            .fill('Only words, no stars')

        await expect(page.getByTestId('review-form-submit')).toBeDisabled()

        await page
            .getByTestId('review-form-rating')
            .locator('button, [role="radio"]')
            .nth(2)
            .click()
        await expect(page.getByTestId('review-form-submit')).toBeEnabled()
    } finally {
        await seeded.cleanup()
    }
})
