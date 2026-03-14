import { eventHandler, getQuery, readBody, createError } from 'h3'
import { createPocketBase } from '../../utils/pb-server.js'

export default eventHandler(async (event) => {
    const pb = createPocketBase()

    try {
        const ids = await resolveRouteIds(event)
        if (ids.length === 0) {
            return createError({
                statusCode: 400,
                statusMessage: 'No IDs provided.',
            })
        }

        const uniqueIds = Array.from(new Set(ids))
        const routes = await fetchRecordsByIds(pb, {
            collection: 'routes',
            ids: uniqueIds,
            field: 'id',
            requestKey: 'export-json-routes',
        })
        const ratings = await fetchRecordsByIds(pb, {
            collection: 'ratings',
            ids: uniqueIds,
            field: 'route_id',
            requestKey: 'export-json-ratings',
        })

        const routeById = new Map()
        for (const route of routes) {
            routeById.set(route.id, route)
        }

        const ratingsByRouteId = new Map()
        for (const rating of ratings) {
            if (!rating.route_id) {
                continue
            }
            if (!ratingsByRouteId.has(rating.route_id)) {
                ratingsByRouteId.set(rating.route_id, [])
            }
            ratingsByRouteId.get(rating.route_id).push(mapRating(rating))
        }

        const payload = []
        for (const id of uniqueIds) {
            const route = routeById.get(id)
            if (!route) {
                continue
            }
            payload.push(mapRoute(route, ratingsByRouteId.get(id) ?? []))
        }

        return payload
    } catch (error) {
        console.error('Failed to export routes as JSON:', error)
        return createError({
            statusCode: 500,
            statusMessage: 'Failed to export routes as JSON',
        })
    }
})

async function resolveRouteIds(event) {
    try {
        const body = await readBody(event)
        if (body && Array.isArray(body.ids)) {
            return body.ids
                .map((value) => (typeof value === 'string' ? value.trim() : ''))
                .filter(Boolean)
        }
    } catch (error) {
        // ignore body parsing errors and fall back to query params
    }

    const params = getQuery(event)
    if (typeof params?.id === 'string') {
        return params.id
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
    }

    return []
}

function buildFilter(ids, field) {
    if (ids.length === 0) {
        return ''
    }
    return ids.map((id) => `${field} = "${id}"`).join(' || ')
}

async function fetchRecordsByIds(pb, options) {
    const { collection, ids, field, requestKey } = options
    if (ids.length === 0) {
        return []
    }

    const chunks = chunk(ids, 25)
    const requests = chunks.map((chunkIds, index) => {
        return pb.collection(collection).getFullList({
            filter: buildFilter(chunkIds, field),
            requestKey: `${requestKey}-${index}`,
        })
    })

    const results = await Promise.all(requests)
    return results.flat()
}

function chunk(source, size) {
    const output = []
    for (let index = 0; index < source.length; index += size) {
        output.push(source.slice(index, index + size))
    }
    return output
}

function mapRoute(route, ratings) {
    return {
        id: route.id ?? null,
        name: route.name ?? '',
        color: route.color ?? null,
        difficulty: normalizeNumber(route.difficulty),
        difficulty_sign: route.difficulty_sign ?? null,
        anchor_point: normalizeNumber(route.anchor_point),
        location: route.location ?? null,
        type: route.type ?? null,
        comment: route.comment ?? '',
        creator: normalizeCreators(route.creator),
        screw_date: route.screw_date ?? null,
        score: route.score ?? null,
        archived: Boolean(route.archived),
        created: route.created ?? null,
        updated: route.updated ?? null,
        ratings,
    }
}

function mapRating(rating) {
    return {
        rating: normalizeNumber(rating.rating),
        difficulty: normalizeNumber(rating.difficulty),
        difficulty_sign: rating.difficulty_sign ?? null,
        comment: rating.comment ?? '',
        created: rating.created ?? null,
        updated: rating.updated ?? null,
    }
}

function normalizeNumber(value) {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : null
}

function normalizeCreators(creators) {
    if (Array.isArray(creators)) {
        return creators
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter(Boolean)
    }
    if (typeof creators === 'string') {
        return creators
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
    }
    return []
}
