import { describe, it, expect, vi } from 'vitest'
import {
    applyRatingChange,
    cacheKeys,
    coalesce,
    isLiveKey,
    mapRows,
    newRecordId,
    patchList,
    ratingsRouteId,
    removeById,
    routeRowsScope,
    shiftScore,
    trackRating,
    upsertById,
    wallsScope,
    type RatingLedger,
} from '~/utils/realtimeCache'
import type {
    RatingRecord,
    RouteRecord,
    RouteScoreRecord,
    WallRecord,
} from '~/types/models'

const route = (
    id: string,
    average_rating: number | null,
    ratings_count: number,
) => ({ id, average_rating, ratings_count }) as RouteScoreRecord

const rating = (id: string, route_id: string, stars: number) =>
    ({ id, route_id, rating: stars }) as RatingRecord

describe('shiftScore', () => {
    it('adds a star rating to the average', () => {
        expect(shiftScore({ average_rating: 4, ratings_count: 2 }, 1)).toEqual({
            average_rating: 3,
            ratings_count: 3,
        })
    })

    it('starts an average from an unrated route', () => {
        expect(
            shiftScore({ average_rating: null, ratings_count: 0 }, 5),
        ).toEqual({ average_rating: 5, ratings_count: 1 })
    })

    it('replaces a rating without changing the count', () => {
        expect(
            shiftScore({ average_rating: 3, ratings_count: 2 }, 5, 1),
        ).toEqual({ average_rating: 5, ratings_count: 2 })
    })

    it('resets to unrated when the last rating is removed', () => {
        expect(
            shiftScore({ average_rating: 4, ratings_count: 1 }, 0, 4),
        ).toEqual({ average_rating: null, ratings_count: 0 })
    })
})

describe('applyRatingChange', () => {
    const routes = [route('a', 4, 1), route('b', null, 0)]

    it('patches only the rated route', () => {
        const next = applyRatingChange(routes, {
            added: rating('r1', 'b', 2),
            removed: null,
        })
        expect(next[0]).toBe(routes[0])
        expect(next[1]).toMatchObject({ average_rating: 2, ratings_count: 1 })
    })

    it('ignores ratings without stars like the view does', () => {
        expect(
            applyRatingChange(routes, {
                added: rating('r1', 'a', 0),
                removed: null,
            }),
        ).toBe(routes)
    })

    it('moves a rating between routes', () => {
        const next = applyRatingChange(routes, {
            added: rating('r1', 'b', 4),
            removed: rating('r1', 'a', 4),
        })
        expect(next[0]).toMatchObject({
            average_rating: null,
            ratings_count: 0,
        })
        expect(next[1]).toMatchObject({ average_rating: 4, ratings_count: 1 })
    })

    it('keeps the list when the route is not loaded', () => {
        expect(
            applyRatingChange(routes, {
                added: rating('r1', 'zzz', 3),
                removed: null,
            }),
        ).toBe(routes)
    })
})

describe('trackRating', () => {
    it('counts an optimistic rating and its realtime echo once', () => {
        const ledger: RatingLedger = new Map()
        const created = rating('r1', 'a', 5)
        expect(trackRating(ledger, 'create', created)).toEqual({
            added: created,
            removed: null,
        })
        expect(trackRating(ledger, 'create', created)).toBeNull()
    })

    it('removes a deleted rating once', () => {
        const ledger: RatingLedger = new Map()
        const deleted = rating('r1', 'a', 5)
        expect(trackRating(ledger, 'delete', deleted)).toEqual({
            added: null,
            removed: deleted,
        })
        expect(trackRating(ledger, 'delete', deleted)).toBeNull()
    })

    it('swaps the previous value on update', () => {
        const ledger: RatingLedger = new Map()
        const before = rating('r1', 'a', 2)
        trackRating(ledger, 'create', before)
        const after = rating('r1', 'a', 5)
        expect(trackRating(ledger, 'update', after)).toEqual({
            added: after,
            removed: before,
        })
    })

    it('falls back to a cached rating on update', () => {
        const cached = rating('r1', 'a', 2)
        const after = rating('r1', 'a', 5)
        expect(trackRating(new Map(), 'update', after, cached)).toEqual({
            added: after,
            removed: cached,
        })
    })

    it('reports an update it cannot diff', () => {
        expect(trackRating(new Map(), 'update', rating('r1', 'a', 5))).toBe(
            'unknown',
        )
    })
})

describe('patchList', () => {
    const list = [{ id: 'a', n: 1 }]

    it('merges a present record', () => {
        expect(patchList(list, { id: 'a', n: 2 }, null)).toEqual([
            { id: 'a', n: 2 },
        ])
    })

    it('inserts an in-scope record with defaults', () => {
        expect(
            patchList(list, { id: 'b' } as { id: string; n: number }, true, {
                n: 0,
            }),
        ).toEqual([list[0], { id: 'b', n: 0 }])
    })

    it('ignores a record of unknown scope', () => {
        expect(patchList(list, { id: 'b', n: 3 }, null)).toBe(list)
    })

    it('drops a record that left the scope', () => {
        expect(patchList(list, { id: 'a', n: 1 }, false)).toEqual([])
    })
})

describe('upsertById / removeById', () => {
    const list = [{ id: 'a', n: 1 }]

    it('prepends a new record', () => {
        expect(
            upsertById(list, { id: 'b', n: 3 }, 'start').map((i) => i.id),
        ).toEqual(['b', 'a'])
    })

    it('keeps the list when nothing is removed', () => {
        expect(removeById(list, 'x')).toBe(list)
    })
})

describe('cache keys', () => {
    it('scopes map routes to their location', () => {
        const inScope = routeRowsScope(cacheKeys.mapRoutes, 'loc1')!
        expect(inScope({ location: 'loc1' } as RouteRecord)).toBe(true)
        expect(inScope({ location: 'loc2' } as RouteRecord)).toBe(false)
    })

    it('never inserts into the paged route list', () => {
        expect(
            routeRowsScope(cacheKeys.routesList)!({} as RouteRecord),
        ).toBeNull()
    })

    it('scopes map walls to their location', () => {
        const inScope = wallsScope(cacheKeys.mapWalls, 'loc1')!
        expect(inScope({ location: 'loc2' } as WallRecord)).toBe(false)
        expect(wallsScope(cacheKeys.overviewRoutes)).toBeUndefined()
    })

    it('reads the route of both rating lists', () => {
        expect(ratingsRouteId(cacheKeys.ratings('r1'))).toBe('r1')
        expect(ratingsRouteId(cacheKeys.ratingsSheet('r2'))).toBe('r2')
        expect(ratingsRouteId(cacheKeys.routesList)).toBeUndefined()
    })

    it('knows which keys realtime keeps live', () => {
        expect(isLiveKey(cacheKeys.route('r1'))).toBe(true)
        expect(isLiveKey(cacheKeys.unplacedRoutes)).toBe(true)
        expect(isLiveKey('cap-status')).toBe(false)
    })
})

describe('mapRows', () => {
    it('patches paged results', () => {
        const page = { items: [{ id: 'a' }], totalItems: 1 }
        expect(mapRows(page, () => [])).toEqual({ items: [], totalItems: 1 })
        expect(mapRows(page, (rows) => rows)).toBe(page)
    })
})

describe('newRecordId', () => {
    it('matches the PocketBase id format', () => {
        expect(newRecordId()).toMatch(/^[a-z0-9]{15}$/)
    })
})

describe('coalesce', () => {
    it('runs a burst of calls once, after the delay', async () => {
        vi.useFakeTimers()
        const task = vi.fn(() => Promise.resolve())
        const run = coalesce(task, 100)
        run()
        run()
        run()
        expect(task).not.toHaveBeenCalled()
        await vi.advanceTimersByTimeAsync(200)
        expect(task).toHaveBeenCalledTimes(1)
        run()
        await vi.advanceTimersByTimeAsync(200)
        expect(task).toHaveBeenCalledTimes(2)
        vi.useRealTimers()
    })
})
