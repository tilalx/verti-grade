import type { Page } from '@playwright/test'
import { authHeader } from './nav'

export async function createReport(
    page: Page,
    options: {
        contentId: string
        contentUrl?: string
        reason?: string
        explanation: string
        notifierName?: string
        notifierEmail?: string
    },
): Promise<string> {
    const res = await page.request.post('/api/collections/reports/records', {
        data: {
            content_type: 'rating',
            content_id: options.contentId,
            content_url:
                options.contentUrl ??
                `/route?id=x#comment-${options.contentId}`,
            reason: options.reason ?? 'spam_fraud',
            explanation: options.explanation,
            notifier_name: options.notifierName ?? 'E2E Reporter',
            notifier_email: options.notifierEmail ?? 'e2e-reporter@example.com',
            good_faith: true,
        },
    })
    return (await res.json()).id as string
}

export async function deleteReport(page: Page, id: string) {
    await page.request.delete(`/api/collections/reports/records/${id}`, {
        headers: await authHeader(page),
    })
}
