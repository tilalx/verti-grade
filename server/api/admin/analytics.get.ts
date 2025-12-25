import { createError, eventHandler } from 'h3'
import { createPocketBase } from '../../utils/pb-server.js'
import type { RatingRecord, RouteRecord } from '../../../types/models'

export default eventHandler(async () => {
    const pb = createPocketBase()

    try {
        const [routeRecords, ratingRecords] = await Promise.all([
            pb.collection('routes').getFullList<RouteRecord>({
                batch: 200,
                requestKey: 'analytics-routes',
            }),
            pb.collection('ratings').getFullList<RatingRecord>({
                batch: 200,
                requestKey: 'analytics-ratings',
            }),
        ])

        const routes = routeRecords ?? []
        const ratings = ratingRecords ?? []

        const ratingBuckets = new Map<string, RatingRecord[]>()
        for (const rating of ratings) {
            if (!rating.route_id) {
                continue
            }
            if (!ratingBuckets.has(rating.route_id)) {
                ratingBuckets.set(rating.route_id, [])
            }
            ratingBuckets.get(rating.route_id)!.push(rating)
        }

        const difficultyMap = new Map<string, number>()
        const setterMap = new Map<string, number>()
        const routeTimelineMap = new Map<string, number>()
        const commentTimelineMap = new Map<string, number>()
        let difficultySum = 0
        let difficultyCount = 0
        const routeById = new Map<string, RouteRecord>()

        for (const route of routes) {
            routeById.set(route.id, route)
            const gradeLabel = buildGradeLabel(route)
            const ratingList = ratingBuckets.get(route.id) ?? []

            increaseCount(difficultyMap, gradeLabel)
            addCreatorsToMap(setterMap, route.creator)
            addDateToTimeline(routeTimelineMap, route.screw_date || route.created)

            const numericDifficulty = Number(route.difficulty)
            if (!Number.isNaN(numericDifficulty)) {
                difficultySum += numericDifficulty
                difficultyCount += 1
            }
        }

        const commentRecords = ratings.filter((rating) =>
            typeof rating.comment === 'string' && rating.comment.trim().length > 0,
        )

        for (const rating of commentRecords) {
            addDateToTimeline(commentTimelineMap, rating.created)
        }

        const summary = {
            totalRoutes: routes.length,
            activeRoutes: routes.filter((route) => !route.archived).length,
            averageDifficulty: difficultyCount > 0 ? difficultySum / difficultyCount : 0,
            totalComments: commentRecords.length,
            generatedAt: new Date().toISOString(),
        }

        const difficultyDistribution = mapToArray(difficultyMap)
            .map(({ label, count }) => ({ grade: label, count }))
            .sort((a, b) => compareGrades(a.grade, b.grade))
        const routeSetters = mapToArray(setterMap).map(({ label, count }) => ({
            setter: label,
            count,
        }))
        const routeTimeline = mapTimeline(routeTimelineMap)
        const commentTimeline = mapTimeline(commentTimelineMap)
        const latestRoutes = computeLatestRoutes(routes)

        const latestComments = commentRecords
            .slice()
            .sort((a, b) => (b.created || '').localeCompare(a.created || ''))
            .slice(0, 5)
            .map((rating, index) => {
                const route = rating.route_id ? routeById.get(rating.route_id) : undefined
                return {
                    id: rating.id ?? `comment-${index}`,
                    routeId: rating.route_id ?? null,
                    routeName: route?.name ?? '',
                    rating: Number.isFinite(Number(rating.rating)) ? Number(rating.rating) : null,
                    comment: (rating.comment || '').trim(),
                    created: rating.created ?? null,
                }
            })

        return {
            summary,
            difficultyDistribution,
            routeSetters,
            routeTimeline,
            commentTimeline,
            latestRoutes,
            latestComments,
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to load analytics data',
            data: {
                message: error?.message || 'Unknown error',
            },
        })
    }
})

function buildGradeLabel(route: RouteRecord): string {
    const base = `${route.difficulty ?? ''}`.trim()
    if (!base) {
        return 'Unknown'
    }
    const sign = route.difficulty_sign
    if (typeof sign === 'string' && sign.trim().length > 0) {
        return `${base}${sign.trim()}`
    }
    if (typeof sign === 'boolean') {
        return `${base}${sign ? '+' : '-'}`
    }
    return base
}

function computeLatestRoutes(routes: RouteRecord[]) {
    const sorted = routes
        .slice()
        .sort((a, b) => routeDateValue(b) - routeDateValue(a))

    return sorted.slice(0, 3).map((route, index) => ({
        id: route.id ?? `route-${index}`,
        name: String(route.name ?? ''),
        difficulty: buildGradeLabel(route),
        location: route.location ?? null,
        screwDate: route.screw_date ?? route.created ?? null,
        creators: extractCreators(route.creator),
        type: route.type ?? null,
    }))
}

function routeDateValue(route: RouteRecord): number {
    const raw = route.screw_date || route.created
    if (!raw) {
        return Number.NEGATIVE_INFINITY
    }
    const timestamp = new Date(raw).getTime()
    return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp
}

function extractCreators(creators: RouteRecord['creator']): string[] {
    if (!creators) {
        return []
    }
    if (Array.isArray(creators)) {
        return creators
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter(Boolean)
    }
    return String(creators)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
}

function increaseCount(map: Map<string, number>, key: string) {
    map.set(key, (map.get(key) ?? 0) + 1)
}

function addCreatorsToMap(map: Map<string, number>, creators: RouteRecord['creator']) {
    if (!creators) {
        return
    }

    const list = Array.isArray(creators)
        ? creators
        : `${creators}`
              .split(',')
              .map((value) => value.trim())

    for (const raw of list) {
        const label = raw.trim()
        if (!label) {
            continue
        }
        increaseCount(map, label)
    }
}

function addDateToTimeline(map: Map<string, number>, rawDate?: string | null) {
    if (!rawDate) {
        return
    }

    const date = new Date(rawDate)
    if (Number.isNaN(date.getTime())) {
        return
    }

    const period = date.toISOString().split('T')[0]
    increaseCount(map, period)
}

function mapToArray(source: Map<string, number>) {
    return Array.from(source.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
}

function mapTimeline(source: Map<string, number>) {
    return Array.from(source.entries())
        .map(([period, count]) => ({ period, count }))
        .sort((a, b) => a.period.localeCompare(b.period))
}

function compareGrades(left: string, right: string): number {
    const leftScore = gradeScore(left)
    const rightScore = gradeScore(right)
    const leftFinite = Number.isFinite(leftScore)
    const rightFinite = Number.isFinite(rightScore)

    if (!leftFinite && !rightFinite) {
        return left.localeCompare(right)
    }
    if (!leftFinite) {
        return 1
    }
    if (!rightFinite) {
        return -1
    }

    return leftScore - rightScore
}

function gradeScore(raw: string): number {
    const value = raw.trim()
    if (!value || value.toLowerCase() === 'unknown') {
        return Number.MAX_SAFE_INTEGER
    }

    const pattern = /^(\d+)([abc]?)([+-]?)$/i
    const match = value.match(pattern)
    if (!match) {
        return Number.MAX_SAFE_INTEGER - 1
    }

    const base = Number.parseInt(match[1], 10)
    const letter = match[2]?.toLowerCase() ?? ''
    const sign = match[3] ?? ''

    const letterMap: Record<string, number> = {
        '': 0,
        a: 1,
        b: 2,
        c: 3,
    }

    const signMap: Record<string, number> = {
        '-': -1,
        '': 0,
        '+': 1,
    }

    const letterScore = letterMap[letter] ?? 0
    const signScore = signMap[sign] ?? 0

    return base * 100 + letterScore * 10 + signScore
}