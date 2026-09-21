import type { AuditAction, AuditLogRecord, RecordId } from '~/types/models'

/**
 * The actions offered in the filter select, in the order they are shown.
 * Must stay in lockstep with the values the PocketBase select field accepts
 * (pb_migrations/1789940001_create_audit_logs_collection.js) and with the
 * `audit.action.*` i18n keys.
 */
export const AUDIT_ACTIONS: AuditAction[] = [
    'create',
    'update',
    'delete',
    'login',
    'login_failed',
    'password_reset_request',
    'password_reset',
    'email_change_request',
    'email_change',
]

/** Collections the hooks actually write entries for, for the filter select. */
export const AUDITED_COLLECTIONS: string[] = [
    'routes',
    'ratings',
    'users',
    'roles',
    'permissions',
    'settings',
    'reports',
]

export type AuditPeriod = '24h' | '7d' | '30d' | 'all'

export const AUDIT_PERIODS: AuditPeriod[] = ['24h', '7d', '30d', 'all']

const PERIOD_HOURS: Record<Exclude<AuditPeriod, 'all'>, number> = {
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30,
}

export function actionColor(action: AuditAction | string): string {
    if (action === 'create') return 'success'
    if (action === 'update') return 'info'
    if (action === 'delete') return 'error'
    if (action === 'login') return 'primary'
    if (action === 'login_failed') return 'warning'
    return 'medium-emphasis'
}

/**
 * PocketBase stores dates as `YYYY-MM-DD HH:MM:SS.sssZ`, and its filter
 * comparison is lexicographic against that exact shape.
 */
export function pbDateString(date: Date): string {
    return date.toISOString().replace('T', ' ')
}

function escapeFilterValue(value: string): string {
    return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
}

export function buildAuditFilter(options: {
    search?: string
    action?: AuditAction | null
    collection?: string | null
    period?: AuditPeriod | null
    actorId?: RecordId | null
}): string {
    const parts: string[] = []

    if (options.actorId) {
        parts.push(`actor = "${escapeFilterValue(options.actorId)}"`)
    }
    if (options.action) {
        parts.push(`action = "${escapeFilterValue(options.action)}"`)
    }
    if (options.collection) {
        parts.push(
            `collection_name = "${escapeFilterValue(options.collection)}"`,
        )
    }

    const period = options.period
    if (period && period !== 'all') {
        const cutoff = new Date(Date.now() - PERIOD_HOURS[period] * 3600000)
        parts.push(`created >= "${pbDateString(cutoff)}"`)
    }

    const term = (options.search ?? '').trim()
    if (term) {
        const escaped = escapeFilterValue(term)
        parts.push(
            `(actor_label ~ "${escaped}" || record_id ~ "${escaped}" || collection_name ~ "${escaped}")`,
        )
    }

    return parts.join(' && ')
}

/**
 * Where the affected record lives, when it still has a page of its own.
 * Entries outlive what they describe, so this is best-effort by design.
 */
export function auditTargetUrl(
    collectionName?: string | null,
    recordId?: string | null,
): string | null {
    if (!collectionName || !recordId) return null
    if (collectionName === 'routes') return `/route?id=${recordId}`
    if (collectionName === 'users') return '/admin/users'
    if (collectionName === 'ratings') return '/admin/comments'
    if (collectionName === 'reports') return '/admin/reports'
    return null
}

/** True when the entry was written for a PocketBase superuser. */
export function isSuperuserEntry(entry: Pick<AuditLogRecord, 'actor_label'>) {
    return (entry.actor_label ?? '').startsWith('superuser')
}
