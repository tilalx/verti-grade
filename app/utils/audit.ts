import type { AuditAction, AuditLogRecord, RecordId } from '~/types/models'

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

export function isRecordAction(action: AuditAction | string): boolean {
    return action === 'create' || action === 'update' || action === 'delete'
}

export function compressIp(ip?: string | null): string {
    if (!ip) return ''
    const groups = ip.split(':')
    if (groups.length !== 8) return ip
    const trimmed = groups.map((g) => g.replace(/^0+(?=.)/, ''))

    let bestStart = -1
    let bestLen = 0
    let runStart = -1
    let runLen = 0
    trimmed.forEach((g, i) => {
        if (g !== '0') {
            runStart = -1
            runLen = 0
            return
        }
        if (runStart < 0) runStart = i
        runLen += 1
        if (runLen > bestLen) {
            bestLen = runLen
            bestStart = runStart
        }
    })

    if (bestLen < 2) return trimmed.join(':')
    return `${trimmed.slice(0, bestStart).join(':')}::${trimmed.slice(bestStart + bestLen).join(':')}`
}

export function actionIcon(action: AuditAction | string): string {
    if (action === 'create') return 'mdi-plus-circle-outline'
    if (action === 'update') return 'mdi-pencil-outline'
    if (action === 'delete') return 'mdi-trash-can-outline'
    if (action === 'login') return 'mdi-login'
    if (action === 'login_failed') return 'mdi-account-alert-outline'
    if (action === 'password_reset' || action === 'password_reset_request') {
        return 'mdi-lock-reset'
    }
    return 'mdi-email-sync-outline'
}

export function actionColor(action: AuditAction | string): string {
    if (action === 'create') return 'success'
    if (action === 'update') return 'info'
    if (action === 'delete') return 'error'
    if (action === 'login') return 'primary'
    if (action === 'login_failed') return 'warning'
    return 'medium-emphasis'
}

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

export function auditTargetUrl(
    collectionName?: string | null,
    recordId?: string | null,
): string | null {
    if (!collectionName || !recordId) return null
    if (collectionName === 'routes') return `/route?id=${recordId}`
    if (collectionName === 'users') return '/admin/users'
    if (collectionName === 'ratings') return '/manage/comments'
    if (collectionName === 'reports') return '/manage/reports'
    return null
}

export function isSuperuserEntry(entry: Pick<AuditLogRecord, 'actor_label'>) {
    return (entry.actor_label ?? '').startsWith('superuser')
}
