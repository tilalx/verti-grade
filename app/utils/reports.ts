import type {
    ReportContentType,
    ReportReason,
    ReportStatus,
    RecordId,
} from '~/types/models'

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
