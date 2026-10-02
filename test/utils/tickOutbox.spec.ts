import { describe, expect, it } from 'vitest'
import type { TickRecord } from '~/types/models'
import {
    applyTickOutbox,
    enqueueTickOp,
    isAlreadyApplied,
    type TickOutboxOp,
} from '~/utils/tickOutbox'

const tick = (id: string, date: string, created = ''): TickRecord => ({
    id,
    user: 'u1',
    route: 'r1',
    type: 'top',
    attempts: 1,
    date,
    created,
})

const create = (id: string, date: string): TickOutboxOp => ({
    op: 'create',
    id,
    record: tick(id, date),
    queued: '2026-10-03T10:00:00Z',
})
const remove = (id: string): TickOutboxOp => ({
    op: 'delete',
    id,
    queued: '2026-10-03T10:00:00Z',
})

describe('enqueueTickOp', () => {
    it('drops a queued create when the same tick is deleted offline', () => {
        const queue = enqueueTickOp([create('a', '2026-10-01')], remove('a'))
        expect(queue).toEqual([])
    })

    it('keeps a delete of a server tick and replaces duplicates by id', () => {
        const queue = enqueueTickOp(
            enqueueTickOp([], remove('srv')),
            remove('srv'),
        )
        expect(queue).toEqual([remove('srv')])
    })
})

describe('applyTickOutbox', () => {
    it('prepends pending creates, hides deletes and sorts by date', () => {
        const ticks = [tick('b', '2026-09-30'), tick('srv', '2026-09-20')]
        const queue = [create('a', '2026-10-01'), remove('srv')]
        const result = applyTickOutbox(ticks, queue)
        expect(result.map((entry) => entry.id)).toEqual(['a', 'b'])
        expect(result[0]?.pending).toBe(true)
        expect(result[1]?.pending).toBeUndefined()
    })

    it('does not duplicate a create the server already returned', () => {
        const result = applyTickOutbox(
            [tick('a', '2026-10-01')],
            [create('a', '2026-10-01')],
        )
        expect(result).toHaveLength(1)
        expect(result[0]?.pending).toBeUndefined()
    })
})

describe('isAlreadyApplied', () => {
    it('treats a 404 delete and a 400 create as already replayed', () => {
        expect(isAlreadyApplied(remove('x'), { status: 404 })).toBe(true)
        expect(isAlreadyApplied(create('x', ''), { status: 400 })).toBe(true)
        expect(isAlreadyApplied(create('x', ''), { status: 0 })).toBe(false)
    })
})
