import { eventHandler, createError } from 'h3'
import { getAuthenticatedPb } from '../../utils/pb-server'
import {
    resolveRouteIds,
    resolveApplicationUrl,
    fetchRecordsByIds,
    resolveExportLocale,
    resolveExportLabel,
    resolveExportShow,
    TAG_QR_ERROR_CORRECTION,
} from '../../utils/export'
import { drawRouteTag } from '../../utils/routeTag'
import type { SettingsRecord } from '../../../types/models'

export default eventHandler(async (event) => {
    const { default: QRCode } = await import('qrcode')
    const { default: PDFDocument } = await import('pdfkit')
    const pb = getAuthenticatedPb(event)
    const res = event.node.res

    const ids = await resolveRouteIds(event)
    if (ids.length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'No IDs provided.',
        })
    }

    try {
        const settings = await pb
            .collection('settings')
            .getOne<SettingsRecord>('settings_123456')

        const show = await resolveExportShow(event)
        let logo: Buffer | null = null
        if (settings.sign_image && show.logo) {
            const logoUrl = pb.files.getURL(settings, settings.sign_image)
            logo = await fetchLogo(logoUrl)
        }

        const applicationUrl = resolveApplicationUrl(event, settings)
        const locale = await resolveExportLocale(event)
        const anchorLabel = await resolveExportLabel(event, 'anchor', 'Anchor')
        const fonts = useStorage('assets:server')
        const [regularFont, boldFont] = await Promise.all([
            fonts.getItemRaw<Buffer>('fonts/Roboto-Regular.ttf'),
            fonts.getItemRaw<Buffer>('fonts/Roboto-Bold.ttf'),
        ])
        if (!regularFont || !boldFont) throw new Error('PDF fonts missing')

        const QR_PX = 330

        const records = await fetchRecordsByIds(pb, {
            collection: 'routes',
            ids,
            field: 'id',
            requestKey: 'pdfExport',
        })
        const byId = new Map(records.map((record) => [record.id, record]))
        const routes = ids
            .map((id) => byId.get(id))
            .filter((route) => route !== undefined)

        const doc = new PDFDocument({ size: [595.28, 841.89] })
        doc.registerFont('Sans', Buffer.from(regularFont))
        doc.registerFont('Sans-Bold', Buffer.from(boldFont))
        doc.font('Sans')
        res.setHeader('Content-Type', 'application/pdf')
        doc.pipe(res)

        for (const [index, route] of routes.entries()) {
            if (index % 8 === 0 && index > 0) doc.addPage()

            const qrCode = await QRCode.toBuffer(
                `${applicationUrl}/route?id=${route.id}`,
                {
                    errorCorrectionLevel: TAG_QR_ERROR_CORRECTION,
                    width: QR_PX,
                    margin: 1,
                    color: { dark: '#000000', light: '#FFFFFF' },
                },
            )
            drawRouteTag(
                doc,
                route,
                index % 2 === 0 ? 20 : 315,
                (Math.floor(index / 2) % 4) * 193 + 30,
                { anchorLabel, locale, qrCode, logo, show },
            )
        }

        doc.end()
    } catch (error) {
        console.error(error)
        if (res.headersSent) {
            res.end()
            return
        }
        throw createError({ statusCode: 500, statusMessage: 'Server error' })
    }
})

async function fetchLogo(url: string) {
    if (!url) {
        return null
    }
    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch logo')
        return Buffer.from(await response.arrayBuffer())
    } catch (error) {
        console.error('Failed to fetch logo:', error)
        return null
    }
}
