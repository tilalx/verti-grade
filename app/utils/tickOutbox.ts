import type { TickRecord } from '~/types/models'

export const TICKS_DB = 'gripello-ticks'

export interface TickOutboxOp {
    op: 'create' | 'delete'
    id: string
    user?: string
    record?: TickRecord
    queued: string
    failed?: string
}

export type PendingTick<T extends TickRecord = TickRecord> = T & {
    pending?: boolean
    syncFailed?: string
}

export function enqueueTickOp(
    queue: TickOutboxOp[],
    op: TickOutboxOp,
): TickOutboxOp[] {
    const queuedCreate = queue.find(
        (entry) => entry.op === 'create' && entry.id === op.id,
    )
    if (op.op === 'delete' && queuedCreate)
        return queue.filter((entry) => entry !== queuedCreate)
    return [...queue.filter((entry) => entry.id !== op.id), op]
}

export function opsOfUser(queue: TickOutboxOp[], userId: string | undefined) {
    return userId ? queue.filter((entry) => entry.user === userId) : []
}

export function applyTickOutbox<T extends TickRecord>(
    ticks: T[],
    queue: TickOutboxOp[],
    userId: string | undefined,
): PendingTick<T>[] {
    const ownOps = opsOfUser(queue, userId)
    const deleted = new Set(
        ownOps
            .filter((entry) => entry.op === 'delete')
            .map((entry) => entry.id),
    )
    const known = new Set(ticks.map((tick) => tick.id))
    const created = ownOps
        .filter(
            (entry): entry is TickOutboxOp & { record: TickRecord } =>
                entry.op === 'create' && !!entry.record && !known.has(entry.id),
        )
        .map((entry) => ({
            ...(entry.record as T),
            pending: true,
            syncFailed: entry.failed,
        }))
    return [...created, ...ticks.filter((tick) => !deleted.has(tick.id))].sort(
        (a, b) =>
            b.date.localeCompare(a.date) ||
            (b.created ?? '').localeCompare(a.created ?? ''),
    )
}

export function isOfflineError(error: unknown) {
    const { status, isAbort } =
        (error as { status?: number; isAbort?: boolean } | null) ?? {}
    if (isAbort) return false
    return (
        (typeof navigator !== 'undefined' && !navigator.onLine) || status === 0
    )
}

const DUPLICATE_ID = 'validation_pk_invalid'

export function isAlreadyApplied(op: TickOutboxOp, error: unknown) {
    const { status, response } =
        (error as {
            status?: number
            response?: { data?: { id?: { code?: string } } }
        } | null) ?? {}
    if (op.op === 'delete') return status === 404
    return status === 400 && response?.data?.id?.code === DUPLICATE_ID
}

export function replayFailure(error: unknown) {
    const { message } = (error as { message?: string } | null) ?? {}
    return message || 'Sync failed'
}
