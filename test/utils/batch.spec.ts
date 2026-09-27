import { describe, expect, it, vi } from 'vitest'
import type PocketBase from 'pocketbase'
import { BATCH_SIZE, sendInBatches } from '~/utils/batch'

function fakePb(failOnBatch = -1) {
    const sentBatchSizes: number[] = []
    const createBatch = vi.fn(() => {
        let queued = 0
        return {
            collection: () => ({ update: () => queued++ }),
            send: vi.fn(async () => {
                if (sentBatchSizes.length === failOnBatch)
                    throw new Error('batch failed')
                sentBatchSizes.push(queued)
            }),
        }
    })
    return { pb: { createBatch } as unknown as PocketBase, sentBatchSizes }
}

describe('sendInBatches', () => {
    it('splits requests into chunks below the PocketBase batch limit', async () => {
        const { pb, sentBatchSizes } = fakePb()
        const ids = Array.from(
            { length: BATCH_SIZE * 2 + 5 },
            (_, i) => `r${i}`,
        )

        await sendInBatches(pb, ids, (batch, id) =>
            batch.collection('routes').update(id, { archived: true }),
        )

        expect(sentBatchSizes).toEqual([BATCH_SIZE, BATCH_SIZE, 5])
        expect(BATCH_SIZE).toBeLessThanOrEqual(200)
    })

    it('sends nothing for an empty list', async () => {
        const { pb, sentBatchSizes } = fakePb()
        await sendInBatches(pb, [], () => {})
        expect(sentBatchSizes).toEqual([])
    })

    it('reports committed chunks before a later chunk fails', async () => {
        const { pb } = fakePb(1)
        const ids = Array.from({ length: BATCH_SIZE + 3 }, (_, i) => `r${i}`)
        const committed: string[] = []

        await expect(
            sendInBatches(
                pb,
                ids,
                (batch, id) => batch.collection('routes').update(id, {}),
                (chunk) => committed.push(...chunk),
            ),
        ).rejects.toThrow('batch failed')

        expect(committed).toEqual(ids.slice(0, BATCH_SIZE))
    })
})
