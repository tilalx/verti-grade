import type PocketBase from 'pocketbase'

type PbBatch = ReturnType<PocketBase['createBatch']>

export const BATCH_SIZE = 150

export async function sendInBatches<T>(
    pb: PocketBase,
    items: readonly T[],
    addToBatch: (batch: PbBatch, item: T) => void,
    onChunkSent?: (chunk: T[]) => void,
) {
    for (let start = 0; start < items.length; start += BATCH_SIZE) {
        const chunk = items.slice(start, start + BATCH_SIZE)
        const batch = pb.createBatch()
        for (const item of chunk) addToBatch(batch, item)
        await batch.send()
        onChunkSent?.(chunk)
    }
}
