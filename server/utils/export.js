import { getQuery, readBody } from 'h3'

/**
 * Resolve the requested route ids from either the JSON body (`{ ids: [...] }`)
 * or the `id` query parameter (comma-separated). Values are trimmed and empty
 * entries dropped.
 */
export async function resolveRouteIds(event) {
    try {
        const body = await readBody(event)
        if (body && Array.isArray(body.ids)) {
            return body.ids
                .map((value) => (typeof value === 'string' ? value.trim() : ''))
                .filter(Boolean)
        }
    } catch {
        // ignore body parsing errors and fall back to query parameters
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

/**
 * Build a PocketBase filter expression matching any of the given ids against
 * `field`. Ids are bound via `pb.filter` so values containing quotes or other
 * filter syntax cannot break out of the expression (injection-safe).
 */
export function buildIdFilter(pb, ids, field) {
    if (ids.length === 0) {
        return ''
    }
    return ids.map((id) => pb.filter(`${field} = {:id}`, { id })).join(' || ')
}

/**
 * Split an array into chunks of at most `size` entries.
 */
export function chunk(source, size) {
    const output = []
    for (let index = 0; index < source.length; index += size) {
        output.push(source.slice(index, index + size))
    }
    return output
}

/**
 * Fetch all records from `collection` whose `field` matches one of `ids`.
 * Requests are chunked to keep filter expressions a reasonable length and run
 * in parallel.
 */
export async function fetchRecordsByIds(pb, options) {
    const { collection, ids, field, requestKey } = options
    if (ids.length === 0) {
        return []
    }

    const chunks = chunk(ids, 25)
    const requests = chunks.map((chunkIds, index) => {
        return pb.collection(collection).getFullList({
            filter: buildIdFilter(pb, chunkIds, field),
            requestKey: `${requestKey}-${index}`,
        })
    })

    const results = await Promise.all(requests)
    return results.flat()
}
