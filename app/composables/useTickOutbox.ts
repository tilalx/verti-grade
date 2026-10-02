import type { TickRecord } from '~/types/models'
import { newRecordId } from '~/utils/realtimeCache'
import {
    enqueueTickOp,
    isAlreadyApplied,
    isOfflineError,
    TICKS_DB,
    type TickOutboxOp,
} from '~/utils/tickOutbox'
const STORES = ['outbox', 'ticks'] as const
type StoreName = (typeof STORES)[number]

function openDb() {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(TICKS_DB, 1)
        request.onupgradeneeded = () => {
            for (const name of STORES)
                if (!request.result.objectStoreNames.contains(name))
                    request.result.createObjectStore(name, { keyPath: 'id' })
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

async function withStore<T>(
    name: StoreName,
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
    const db = await openDb()
    return new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(name, mode)
        const request = run(tx.objectStore(name))
        tx.oncomplete = () => {
            db.close()
            resolve(request ? request.result : undefined)
        }
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
    })
}

function readAll<T>(name: StoreName) {
    return withStore<T[]>(name, 'readonly', (store) => store.getAll()).then(
        (rows) => rows ?? [],
    )
}

function replaceAll<T extends { id: string }>(name: StoreName, rows: T[]) {
    return withStore(name, 'readwrite', (store) => {
        store.clear()
        for (const row of rows) store.put(row)
    })
}

export function useTickOutbox() {
    const pb = usePocketbase()
    const queue = useState<TickOutboxOp[]>('tick-outbox', () => [])
    const loaded = useState('tick-outbox-loaded', () => false)
    const available = import.meta.client && 'indexedDB' in globalThis

    async function load() {
        if (!available || loaded.value) return
        queue.value = await readAll<TickOutboxOp>('outbox').catch(() => [])
        loaded.value = true
    }

    function enqueue(op: TickOutboxOp) {
        queue.value = enqueueTickOp(queue.value, op)
        if (available) void replaceAll('outbox', queue.value).catch(() => {})
    }

    async function createTick(fields: Omit<TickRecord, 'id'>) {
        const now = new Date().toISOString()
        const record: TickRecord = {
            ...fields,
            id: newRecordId(),
            created: now,
            updated: now,
        }
        try {
            return {
                tick: await pb.collection('ticks').create<TickRecord>(record),
                queued: false,
            }
        } catch (error) {
            if (!available || !isOfflineError(error)) throw error
            enqueue({ op: 'create', id: record.id, record, queued: now })
            return { tick: record, queued: true }
        }
    }

    async function deleteTick(id: string) {
        try {
            await pb.collection('ticks').delete(id)
            return { queued: false }
        } catch (error) {
            if (!available || !isOfflineError(error)) throw error
            enqueue({ op: 'delete', id, queued: new Date().toISOString() })
            return { queued: true }
        }
    }

    async function flush() {
        await load()
        if (!queue.value.length || !pb.authStore.isValid) return
        for (const op of [...queue.value]) {
            try {
                if (op.op === 'create')
                    await pb.collection('ticks').create(op.record)
                else await pb.collection('ticks').delete(op.id)
            } catch (error) {
                if (isOfflineError(error)) return
                if (!isAlreadyApplied(op, error))
                    console.error('Replaying tick failed:', error)
            }
            queue.value = queue.value.filter((entry) => entry !== op)
        }
        if (available) await replaceAll('outbox', queue.value).catch(() => {})
        await refreshNuxtData(['logbook', 'ticked-routes'])
    }

    function cacheTicks<T extends TickRecord>(ticks: T[]) {
        if (available) void replaceAll('ticks', ticks).catch(() => {})
    }

    function cachedTicks<T extends TickRecord>() {
        return available ? readAll<T>('ticks').catch(() => []) : []
    }

    async function clear() {
        queue.value = []
        if (!available) return
        await Promise.all(STORES.map((name) => replaceAll(name, []))).catch(
            () => {},
        )
    }

    return {
        queue,
        load,
        createTick,
        deleteTick,
        flush,
        cacheTicks,
        cachedTicks,
        clear,
    }
}
