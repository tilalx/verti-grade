import { getQuery, readBody, getRequestURL } from 'h3'

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

export function buildIdFilter(pb, ids, field) {
    if (ids.length === 0) {
        return ''
    }
    return ids.map((id) => pb.filter(`${field} = {:id}`, { id })).join(' || ')
}

export function chunk(source, size) {
    const output = []
    for (let index = 0; index < source.length; index += size) {
        output.push(source.slice(index, index + size))
    }
    return output
}

export async function fetchRecordsByIds(pb, options) {
    const { collection, ids, field, requestKey, expand } = options
    if (ids.length === 0) {
        return []
    }

    const chunks = chunk(ids, 25)
    const requests = chunks.map((chunkIds, index) => {
        return pb.collection(collection).getFullList({
            filter: buildIdFilter(pb, chunkIds, field),
            expand,
            requestKey: `${requestKey}-${index}`,
        })
    })

    const results = await Promise.all(requests)
    return results.flat()
}

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

export function resolveApplicationUrl(event, settings) {
    return (
        settings?.application_url ||
        getRequestURL(event, {
            xForwardedHost: true,
            xForwardedProto: true,
        }).origin
    ).replace(/\/+$/, '')
}

export function routeLocationName(route) {
    return route?.expand?.location?.name ?? ''
}

export async function resolveExportLocale(event) {
    const body = await readExportBody(event)
    try {
        return (
            Intl.DateTimeFormat.supportedLocalesOf([String(body?.locale)])[0] ??
            'en'
        )
    } catch {
        return 'en'
    }
}

export async function resolveExportLabel(event, key, fallback) {
    const label = (await readExportBody(event))?.labels?.[key]
    return typeof label === 'string' && label.trim() ? label.trim() : fallback
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

export const ROUTE_EXPORT_COLUMNS = [
    { key: 'color', header: 'Color' },
    { key: 'name', header: 'Name', value: (r) => r.name ?? '' },
    {
        key: 'difficulty',
        header: 'Difficulty',
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
        header: 'Anchor point',
        value: (r) => r.anchor_point ?? '',
    },
    {
        key: 'comment',
        header: 'Comment',
        value: (r) => r.comment ?? '',
    },
    {
        key: 'creator',
        header: 'Route setters',
        value: (r) => normalizeCreators(r.creator).join(', '),
    },
    {
        key: 'location',
        header: 'Location',
        value: (r) => routeLocationName(r),
    },
    { key: 'type', header: 'Type', value: (r) => r.type ?? '' },
    {
        key: 'screw_date',
        header: 'Set on',
        value: (r, locale) =>
            r.screw_date
                ? new Date(r.screw_date).toLocaleDateString(locale)
                : '',
    },
    { key: 'qr', header: 'QR' },
]

const DEFAULT_EXPORT_COLUMNS = ROUTE_EXPORT_COLUMNS.filter(
    (column) => column.key !== 'qr',
)

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
    const locale = await resolveExportLocale(event)

    return chosen.map((column) => ({
        ...column,
        value: column.value && ((route) => column.value(route, locale)),
        header:
            typeof labels[column.key] === 'string' && labels[column.key].trim()
                ? labels[column.key].trim()
                : column.header,
    }))
}
