import type { Page } from '@playwright/test'
import { authHeader } from './nav'
import { uiaa } from './seed'

export async function createComment(
    page: Page,
    routeId: string,
    comment: string,
    rating = 5,
): Promise<string> {
    const res = await page.request.post('/api/collections/ratings/records', {
        headers: await authHeader(page),
        data: {
            route_id: routeId,
            rating,
            ...uiaa('5'),
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
