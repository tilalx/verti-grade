import type { Page } from '@playwright/test'
import { authHeader } from './nav'

export const PNG_PIXEL = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
)

export async function reportDefect(
    page: Page,
    options: { routeId: string; category?: string; description: string },
): Promise<string> {
    const res = await page.request.post('/api/collections/tasks/records', {
        headers: await authHeader(page),
        data: {
            kind: 'defect',
            route: options.routeId,
            category: options.category ?? 'loose_bolt',
            description: options.description,
        },
    })
    return (await res.json()).id as string
}
