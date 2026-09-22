import type { Page } from '@playwright/test'
import { authHeader } from './nav'

export async function firstRouteId(page: Page): Promise<string> {
    const routeRes = await page.request.get(
        '/api/collections/routes/records?perPage=1&filter=' +
            encodeURIComponent('name ~ "e2e-route-" && archived = false'),
    )
    return (await routeRes.json()).items[0].id as string
}

export async function createComment(
    page: Page,
    comment: string,
    rating = 5,
): Promise<string> {
    const headers = await authHeader(page)
    const routeId = await firstRouteId(page)

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

export async function deleteComment(page: Page, id: string) {
    await page.request.delete(`/api/collections/ratings/records/${id}`, {
        headers: await authHeader(page),
    })
}
