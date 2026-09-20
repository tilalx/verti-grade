import type { Page } from '@playwright/test'
import { authHeader } from './nav'

/**
 * A DSA Art. 16 report the calling test owns.
 *
 * Same ownership rule as `createComment`: with `fullyParallel` a sibling test
 * is deciding on whichever report is `.first()` in the queue, so address your
 * own record by id. The returned id is also the card's `data-testid` suffix.
 *
 * Creating a report needs no auth — Art. 16(1) requires the form to accept a
 * notice from anyone — but the PocketBase create hook still stamps `status`,
 * `content_snapshot` and the decision fields, so don't bother sending them.
 */
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
                options.contentUrl ?? `/route?id=x#comment-${options.contentId}`,
            reason: options.reason ?? 'spam_fraud',
            explanation: options.explanation,
            notifier_name: options.notifierName ?? 'E2E Reporter',
            notifier_email: options.notifierEmail ?? 'e2e-reporter@example.com',
            good_faith: true,
        },
    })
    return (await res.json()).id as string
}

/** Drops a report created by `createReport`. Safe to call on a deleted id. */
export async function deleteReport(page: Page, id: string) {
    await page.request.delete(`/api/collections/reports/records/${id}`, {
        headers: await authHeader(page),
    })
}
