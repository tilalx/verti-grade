import { eventHandler, getQuery, readBody, createError, getHeader } from 'h3'
import { createAuthedPocketBase } from '../../utils/pb-auth.js'
import { resolveTenantFromHost } from '../../utils/tenant.ts'

export default eventHandler(async (event) => {
    const { default: ExcelJS } = await import('exceljs')

    const pb = createAuthedPocketBase(event)
    const res = event.node.res

    const host = getHeader(event, 'host') ?? ''
    const tenant = await resolveTenantFromHost(host)
    if (!tenant?.id) {
        return createError({ statusCode: 400, statusMessage: 'Tenant not resolved.' })
    }

    try {
        const ids = await resolveRouteIds(event)
        if (ids.length === 0) {
            return createError({
                statusCode: 400,
                statusMessage: 'No IDs provided.',
            })
        }

        const climbingRoutes = []
        for (let id of ids) {
            const climbingRoute = await pb
                .collection('routes')
                .getFirstListItem(`id = "${id}" && tenant_id = "${tenant.id}"`)
            climbingRoutes.push(climbingRoute)
        }

        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Climbing Routes')

        // Define columns
        worksheet.columns = [
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Schwierigkeit', key: 'difficulty', width: 20 },
            {
                header: 'Schwierigkeits Zeichen',
                key: 'difficulty_sign',
                width: 10,
            },
            { header: 'Umlenkerpunkt', key: 'anchor_point', width: 15 },
            { header: 'Ort', key: 'location', width: 20 },
            { header: 'Typ', key: 'type', width: 15 },
            { header: 'Kommentar', key: 'comment', width: 30 },
            { header: 'Schrauber', key: 'creator', width: 30 },
            { header: 'Schraubdatum', key: 'screw_date', width: 15 },
        ]

        // Add rows — prefix string cells with \t to prevent formula injection
        climbingRoutes.forEach((cr) => {
            const safeStr = (v) => (typeof v === 'string' && /^[=+\-@|]/.test(v) ? `\t${v}` : v)
            worksheet.addRow({
                name: safeStr(cr.name),
                difficulty: cr.difficulty,
                difficulty_sign:
                    cr.difficulty_sign === true
                        ? '+'
                        : cr.difficulty_sign === false
                          ? '-'
                          : '',
                anchor_point:
                    cr.anchor_point !== null && cr.anchor_point !== undefined
                        ? cr.anchor_point
                        : '',
                location: safeStr(cr.location),
                type: safeStr(cr.type),
                comment: safeStr(cr.comment),
                creator: safeStr(cr.creator.join(', ')),
                screw_date: new Date(cr.screw_date).toLocaleDateString('de-DE'),
            })
        })

        // Write to buffer
        const buffer = await workbook.xlsx.writeBuffer()

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="climbing-routes-${Date.now()}.xlsx"`,
        )
        res.end(buffer)
    } catch (error) {
        console.error(error)
        return createError({ statusCode: 500, statusMessage: 'Server error' })
    }
})

const ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/

async function resolveRouteIds(event) {
    try {
        const body = await readBody(event)
        if (body && Array.isArray(body.ids)) {
            return body.ids
                .map((value) => (typeof value === 'string' ? value.trim() : ''))
                .filter((id) => typeof id === 'string' && ID_PATTERN.test(id))
        }
    } catch (error) {
        // ignore body parsing errors and fall back to query parameters
    }

    const params = getQuery(event)
    if (typeof params?.id === 'string') {
        return params.id
            .split(',')
            .map((value) => value.trim())
            .filter((id) => ID_PATTERN.test(id))
    }

    return []
}
