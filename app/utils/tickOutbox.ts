import type { TickRecord } from '~/types/models'

export const TICKS_DB = 'gripello-ticks'

export interface TickOutboxOp {
    op: 'create' | 'delete'
    id: string
    record?: TickRecord
    queued: string
}

export type PendingTick<T extends TickRecord = TickRecord> = T & {
    pending?: boolean
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

export function applyTickOutbox<T extends TickRecord>(
    ticks: T[],
    queue: TickOutboxOp[],
): PendingTick<T>[] {
    const deleted = new Set(
        queue.filter((entry) => entry.op === 'delete').map((entry) => entry.id),
    )
    const known = new Set(ticks.map((tick) => tick.id))
    const created = queue
        .filter(
            (entry): entry is TickOutboxOp & { record: TickRecord } =>
                entry.op === 'create' && !!entry.record && !known.has(entry.id),
        )
        .map((entry) => ({ ...(entry.record as T), pending: true }))
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

export function isAlreadyApplied(op: TickOutboxOp, error: unknown) {
    const status = (error as { status?: number } | null)?.status
    return op.op === 'delete' ? status === 404 : status === 400
}
