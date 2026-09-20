import type {
    ReportContentType,
    ReportReason,
    ReportStatus,
    RecordId,
} from '~/types/models'

/**
 * The reason list offered in the report dialog, in the order it is shown.
 * Kept next to the URL helper so the select and the i18n keys cannot drift
 * apart from the values the PocketBase select field accepts.
 */
export const REPORT_REASONS: ReportReason[] = [
    'hate_speech',
    'harassment',
    'violence_threat',
    'sexual_content',
    'personal_data',
    'ip_infringement',
    'spam_fraud',
    'other',
]

/**
 * DSA Art. 16(2)(b) requires the notice to carry the exact electronic location
 * of the reported content. A comment has no page of its own, so it is
 * addressed as an anchor on the route page that renders it.
 */
export function reportContentUrl(
    type: ReportContentType,
    id: RecordId,
    routeId?: RecordId | null,
): string {
    if (type === 'route') return `/route?id=${id}`
    return routeId ? `/route?id=${routeId}#comment-${id}` : `#comment-${id}`
}

export function statusColor(status: ReportStatus | string): string {
    if (status === 'open') return 'warning'
    if (status === 'actioned') return 'success'
    if (status === 'rejected') return 'medium-emphasis'
    return 'medium-emphasis'
}
