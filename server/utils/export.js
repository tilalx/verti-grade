import { getQuery, readBody, getRequestURL } from 'h3'

/**
 * Read and cache the parsed request body so several resolvers can inspect it
 * without consuming the stream twice.
 */
async function readExportBody(event) {
    if (event.context._exportBody === undefined) {
        try {
            event.context._exportBody = (await readBody(event)) ?? null
        } catch {
            event.context._exportBody = null
        }
    }
    return event.context._exportBody
}

/**
 * Resolve the requested route ids from either the JSON body (`{ ids: [...] }`)
 * or the `id` query parameter (comma-separated). Values are trimmed and empty
 * entries dropped.
 */
export async function resolveRouteIds(event) {
    const body = await readExportBody(event)
    if (body && Array.isArray(body.ids)) {
        return body.ids
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter(Boolean)
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

/**
 * Normalize the PocketBase `creator` JSON field, which may hold an array, a
 * comma-separated string or nothing at all.
 */
export function normalizeCreators(creators) {
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

/**
 * Public base URL used to build route links (QR codes). Prefers the configured
 * application URL and falls back to the origin of the incoming request, which
 * behind the production proxy is the real host.
 */
export function resolveApplicationUrl(event, settings) {
    return (
        settings?.application_url ||
        getRequestURL(event, {
            xForwardedHost: true,
            xForwardedProto: true,
        }).origin
    ).replace(/\/+$/, '')
}

function formatDifficultySign(value) {
    if (typeof value === 'string') {
        return value.trim()
    }
    if (value === true) {
        return '+'
    }
    if (value === false) {
        return '-'
    }
    return ''
}

/**
 * Every column the XLSX export can render, in the default order (the one the
 * route table uses). `header` is the fallback used when the client sends no
 * localized label. Columns without a `value` carry no plain cell text and are
 * rendered by the handler (QR image, color swatch).
 */
export const ROUTE_EXPORT_COLUMNS = [
    { key: 'color', header: 'Farbe' },
    { key: 'name', header: 'Name', value: (r) => r.name ?? '' },
    {
        key: 'difficulty',
        header: 'Schwierigkeit',
        // Written as the plain number with a custom format appending the sign,
        // so the cell reads "6 +" but still sorts and filters numerically.
        value: (r) => {
            const numeric = Number(r.difficulty)
            return Number.isFinite(numeric)
                ? numeric
                : `${r.difficulty ?? ''}${formatDifficultySign(r.difficulty_sign)}`.trim()
        },
        numFmt: (r) => {
            const sign = formatDifficultySign(r.difficulty_sign)
            return Number.isFinite(Number(r.difficulty)) && sign
                ? `0" ${sign}"`
                : null
        },
    },
    {
        key: 'anchor_point',
        header: 'Umlenkerpunkt',
        value: (r) => r.anchor_point ?? '',
    },
    {
        key: 'comment',
        header: 'Kommentar',
        value: (r) => r.comment ?? '',
    },
    {
        key: 'creator',
        header: 'Schrauber',
        value: (r) => normalizeCreators(r.creator).join(', '),
    },
    {
        key: 'location',
        header: 'Ort',
        value: (r) => r.location ?? '',
    },
    { key: 'type', header: 'Typ', value: (r) => r.type ?? '' },
    {
        key: 'screw_date',
        header: 'Schraubdatum',
        value: (r) =>
            r.screw_date
                ? new Date(r.screw_date).toLocaleDateString('de-DE')
                : '',
    },
    { key: 'qr', header: 'QR' },
]

// Everything but the QR code, which stays opt-in because it makes rows tall.
const DEFAULT_EXPORT_COLUMNS = ROUTE_EXPORT_COLUMNS.filter(
    (column) => column.key !== 'qr',
)

/**
 * Resolve the columns to render from `{ columns: [...], labels: {...} }` in the
 * request body. The requested order is the sheet order; unknown and duplicate
 * keys are dropped, so the body can never inject arbitrary columns. A request
 * without `columns` falls back to the default set.
 */
export async function resolveExportColumns(event) {
    const body = await readExportBody(event)
    const columnByKey = new Map(
        ROUTE_EXPORT_COLUMNS.map((column) => [column.key, column]),
    )

    const requested = Array.isArray(body?.columns)
        ? Array.from(
              new Set(
                  body.columns.filter(
                      (key) => typeof key === 'string' && columnByKey.has(key),
                  ),
              ),
          )
        : []

    const chosen = requested.length
        ? requested.map((key) => columnByKey.get(key))
        : DEFAULT_EXPORT_COLUMNS
    const labels =
        body?.labels && typeof body.labels === 'object' ? body.labels : {}

    return chosen.map((column) => ({
        ...column,
        header:
            typeof labels[column.key] === 'string' && labels[column.key].trim()
                ? labels[column.key].trim()
                : column.header,
    }))
}
