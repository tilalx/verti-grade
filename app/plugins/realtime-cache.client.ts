import type { RecordSubscription } from 'pocketbase'
import type {
    RatingRecord,
    RouteRecord,
    RouteScoreRecord,
    WallRecord,
} from '~/types/models'
import {
    applyRatingChange,
    cacheKeys,
    coalesce,
    isLiveKey,
    mapRows,
    NEW_ROUTE_SCORE,
    patchList,
    ratingsRouteId,
    removeById,
    routeRowsScope,
    rowsOf,
    trackRating,
    upsertById,
    wallsScope,
    type RatingChange,
    type RatingLedger,
    type RowsData,
} from '~/utils/realtimeCache'

const RECONNECT_SPREAD_MS = 5000

export default defineNuxtPlugin((nuxtApp) => {
    const pb = usePocketbase()
    // ponytail: grows by one small entry per rating seen this session
    const ratingLedger: RatingLedger = new Map()
    const routesToRescore = new Set<string>()

    function loadedKeys() {
        return Object.keys(nuxtApp.payload.data).filter(
            (key) => nuxtApp.payload.data[key] !== undefined,
        )
    }

    function read<T>(key: string): T {
        return (nuxtApp._asyncData[key]?.data.value ??
            nuxtApp.payload.data[key]) as T
    }

    function write<T>(key: string, value: T) {
        const entry = nuxtApp._asyncData[key]
        if (entry) entry.data.value = value
        else nuxtApp.payload.data[key] = value
    }

    function patchRouteRows(
        patch: (
            rows: RouteScoreRecord[],
            inScope: (route: RouteRecord) => boolean | null,
        ) => RouteScoreRecord[],
    ) {
        for (const key of loadedKeys()) {
            const inScope = routeRowsScope(key)
            if (!inScope) continue
            const data = read<RowsData<RouteScoreRecord>>(key)
            const next = mapRows(data, (rows) => patch(rows, inScope))
            if (next !== data) write(key, next)
        }
    }

    function patchRatingLists(
        patch: (ratings: RatingRecord[], routeId: string) => RatingRecord[],
    ) {
        for (const key of loadedKeys()) {
            const routeId = ratingsRouteId(key)
            if (routeId === undefined) continue
            const data = read<RatingRecord[]>(key)
            const next = patch(data, routeId)
            if (next !== data) write(key, next)
        }
    }

    function cachedRating(id: string) {
        for (const key of loadedKeys()) {
            if (ratingsRouteId(key) === undefined) continue
            const found = read<RatingRecord[]>(key).find(
                (rating) => rating.id === id,
            )
            if (found) return found
        }
    }

    function hasRouteRow(routeId: string) {
        return loadedKeys().some(
            (key) =>
                !!routeRowsScope(key) &&
                rowsOf(read<RowsData<RouteScoreRecord>>(key)).some(
                    (row) => row.id === routeId,
                ),
        )
    }

    const rescoreSoon = coalesce(async () => {
        const ids = [...routesToRescore]
        routesToRescore.clear()
        const scores = await pb
            .collection('averageRating')
            .getFullList<RouteScoreRecord>({
                filter: ids
                    .map((id) => pb.filter('id = {:id}', { id }))
                    .join(' || '),
                fields: 'id,average_rating,ratings_count',
                requestKey: null,
            })
        for (const score of scores)
            patchRouteRows((rows) => patchList(rows, score, null))
    })

    const refreshUnplacedSoon = coalesce(() =>
        refreshNuxtData(cacheKeys.unplacedRoutes),
    )

    function applyChange(change: RatingChange | 'unknown' | null) {
        if (change && change !== 'unknown')
            patchRouteRows((rows) => applyRatingChange(rows, change))
    }

    function applyRating(rating: RatingRecord) {
        patchRatingLists((ratings, routeId) =>
            routeId === rating.route_id
                ? upsertById(ratings, rating, 'start')
                : ratings,
        )
        applyChange(trackRating(ratingLedger, 'create', rating))
    }

    function revertRating(rating: RatingRecord) {
        patchRatingLists((ratings) => removeById(ratings, rating.id))
        applyChange(trackRating(ratingLedger, 'delete', rating))
    }

    function onRating({ action, record }: RecordSubscription<RatingRecord>) {
        if (action === 'create') return applyRating(record)
        if (action === 'delete') return revertRating(record)
        const change = trackRating(
            ratingLedger,
            action,
            record,
            cachedRating(record.id),
        )
        patchRatingLists((ratings, routeId) =>
            routeId === record.route_id
                ? upsertById(ratings, record, 'start')
                : removeById(ratings, record.id),
        )
        if (change !== 'unknown') return applyChange(change)
        if (!record.route_id || !hasRouteRow(record.route_id)) return
        routesToRescore.add(record.route_id)
        rescoreSoon()
    }

    function onRoute({ action, record }: RecordSubscription<RouteRecord>) {
        const removed = action === 'delete' || !!record.archived
        patchRouteRows((rows, inScope) =>
            patchList<RouteScoreRecord>(
                rows,
                record,
                removed ? false : inScope(record),
                NEW_ROUTE_SCORE,
            ),
        )
        const keys = loadedKeys()
        if (action !== 'delete' && keys.includes(cacheKeys.route(record.id)))
            void refreshNuxtData(cacheKeys.route(record.id))
        if (keys.includes(cacheKeys.unplacedRoutes)) refreshUnplacedSoon()
    }

    function onWall({ action, record }: RecordSubscription<WallRecord>) {
        for (const key of loadedKeys()) {
            const inScope = wallsScope(key)
            if (!inScope) continue
            const data = read<WallRecord[]>(key)
            const next = patchList(
                data,
                record,
                action === 'delete' ? false : inScope(record),
            )
            if (next !== data) write(key, next)
        }
    }

    let awaitingFirstConnect = !pb.realtime.isConnected
    function onConnect() {
        if (awaitingFirstConnect) {
            awaitingFirstConnect = false
            return
        }
        setTimeout(() => {
            const keys = loadedKeys().filter(isLiveKey)
            if (keys.length) void refreshNuxtData(keys)
        }, Math.random() * RECONNECT_SPREAD_MS)
    }

    nuxtApp.hook('app:mounted', () => {
        const subscriptions = [
            pb.realtime.subscribe('PB_CONNECT', onConnect),
            pb.collection('ratings').subscribe<RatingRecord>('*', onRating),
            pb.collection('routes').subscribe<RouteRecord>('*', onRoute),
            pb.collection('walls').subscribe<WallRecord>('*', onWall),
        ]
        for (const subscription of subscriptions)
            subscription.catch((error) =>
                console.error('Realtime subscription failed:', error),
            )
    })

    return { provide: { realtimeCache: { applyRating, revertRating } } }
})
