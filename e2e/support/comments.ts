import type { Page } from '@playwright/test'
import { authHeader } from './nav'

/**
 * A comment the calling test owns.
 *
 * Tests used to reach for whichever card was `.first()` in the shared seeded
 * list and then mutate it — but with `fullyParallel` a sibling test is editing
 * or deleting that same card at the same moment, so the card would vanish
 * mid-test. Own the record instead and address it by id.
 *
 * Call this after the first navigation: `authHeader` reads the SDK's token out
 * of localStorage, which is only populated once the origin has loaded.
 * The returned id is also the card's `data-testid` suffix.
 */
export async function createComment(
    page: Page,
    comment: string,
    rating = 5,
): Promise<string> {
    const headers = await authHeader(page)
    const routeRes = await page.request.get(
        '/api/collections/routes/records?perPage=1&filter=' +
            encodeURIComponent('name ~ "e2e-route-" && archived = false'),
    )
    const routeId = (await routeRes.json()).items[0].id as string

    const res = await page.request.post('/api/collections/ratings/records', {
        headers,
        data: {
            route_id: routeId,
            rating,
            difficulty: 5,
            difficulty_sign: null,
            comment,
        },
    })
    return (await res.json()).id as string
}

/** Drops a comment created by `createComment`. Safe to call on a deleted id. */
export async function deleteComment(page: Page, id: string) {
    await page.request.delete(`/api/collections/ratings/records/${id}`, {
        headers: await authHeader(page),
    })
}
