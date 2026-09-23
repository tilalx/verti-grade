import { eventHandler, createError } from 'h3'
import { getAuthenticatedPb } from '../../utils/pb-server'
import {
    resolveRouteIds,
    resolveApplicationUrl,
    fetchRecordsByIds,
    resolveExportLocale,
    resolveExportLabel,
} from '../../utils/export'
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

        let logo: Buffer | null = null
        if (settings.sign_image) {
            const logoUrl = pb.files.getURL(settings, settings.sign_image)
            logo = await fetchLogo(logoUrl)
        }

        const applicationUrl = resolveApplicationUrl(event, settings)
        const locale = await resolveExportLocale(event)
        const ropeLabel = await resolveExportLabel(event, 'rope', 'Rope')

        // ── Layout constants ───────────────────────────────────────────────
        const QR_SIZE = 110 // Rendered size of the QR code in PDF points (square)
        const QR_PX = 330 // Pixel size of the generated QR image (3× for sharpness)

        const CIRCLE_RADIUS = 12 // Radius of the route color circle
        const CIRCLE_BORDER = 1.5 // Dark outline for light-color visibility
        // ──────────────────────────────────────────────────────────────────

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
        res.setHeader('Content-Type', 'application/pdf')
        doc.pipe(res)

        let entryCount = 0

        for (const climbingRoute of routes) {
            const id = climbingRoute.id

            if (entryCount % 8 === 0 && entryCount > 0) {
                doc.addPage()
            }

            const x = entryCount % 2 === 0 ? 20 : 315
            const y = (Math.floor(entryCount / 2) % 4) * 193 + 30

            doc.rect(x - 10, y - 10, 280, 170).stroke()

            doc.fillColor('black')

            const textOptions = { align: 'left' as const, width: 200 }
            let sign = ''

            if (typeof climbingRoute.difficulty_sign === 'string') {
                sign = climbingRoute.difficulty_sign.trim()
            } else if (typeof climbingRoute.difficulty_sign === 'boolean') {
                sign = climbingRoute.difficulty_sign ? '+' : '-'
            }

            const difficulty = `${climbingRoute.difficulty}${sign}`

            doc.text(
                difficulty,
                calculateStartX(x + 80, difficulty, doc, 45),
                y + 55,
                textOptions,
            )

            doc.text(
                climbingRoute.name,
                calculateStartX(x + 80, climbingRoute.name, doc),
                y + 35,
                textOptions,
            )

            doc.text(
                climbingRoute.comment ?? '',
                calculateStartX(x + 80, climbingRoute.comment ?? '', doc),
                y + 100,
                textOptions,
            )

            doc.fillColor('black')

            if (
                climbingRoute.anchor_point !== null &&
                climbingRoute.anchor_point !== undefined &&
                climbingRoute.anchor_point !== 0
            ) {
                const anchorValue = String(climbingRoute.anchor_point).trim()

                const boxWidth = 32
                const boxX = x + 65
                const boxY = y + 5

                doc.font('Helvetica')
                    .fontSize(8)
                    .fillColor('black')
                    .text(ropeLabel, boxX, boxY + 4, {
                        width: boxWidth,
                        align: 'center',
                    })

                doc.font('Helvetica-Bold')
                    .fontSize(12)
                    .text(anchorValue, boxX, boxY + 12, {
                        width: boxWidth,
                        align: 'center',
                    })
            }

            const creators = climbingRoute.creator || []
            if (Array.isArray(creators) && creators.length > 0) {
                const creatorText = creators.join(' / ')
                doc.font('Helvetica').fontSize(8)
                const maxWidth = 130
                const measuredWidth = doc.widthOfString(creatorText)
                const creatorFontSize = measuredWidth > maxWidth ? 6 : 8

                doc.fontSize(creatorFontSize).text(
                    creatorText,
                    calculateStartX(x + 80, creatorText, doc, creatorFontSize),
                    y + 130,
                    {
                        align: 'left',
                        width: maxWidth,
                        lineBreak: false,
                        ellipsis: true,
                    },
                )
            }

            const date = new Date(climbingRoute.screw_date ?? 0)
            const screw_date = date.toLocaleDateString(locale)
            doc.fontSize(8).text(
                screw_date,
                calculateStartX(x + 80, screw_date, doc),
                y + 145,
                textOptions,
            )

            // ── QR code ────────────────────────────────────────────────────
            const qrX = x + 159
            const qrY = y - 9

            const serverUrl = applicationUrl + `/route?id=${id}`
            const qrCodeBuffer = await QRCode.toBuffer(serverUrl, {
                errorCorrectionLevel: 'H',
                width: QR_PX,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            })
            doc.image(qrCodeBuffer, qrX, qrY, {
                width: QR_SIZE,
                height: QR_SIZE,
            })

            // ── Color circle — precisely centered on the QR image ──────────
            const cx = qrX + QR_SIZE / 2
            const cy = qrY + QR_SIZE / 2

            doc.circle(cx, cy, CIRCLE_RADIUS + CIRCLE_BORDER + 1).fill(
                '#FFFFFF',
            )
            doc.circle(cx, cy, CIRCLE_RADIUS + CIRCLE_BORDER).fill('#333333')
            doc.circle(cx, cy, CIRCLE_RADIUS + 0.5).fill('#FFFFFF')
            doc.circle(cx, cy, CIRCLE_RADIUS).fill(
                climbingRoute.color as string,
            )
            // ──────────────────────────────────────────────────────────────

            if (logo) {
                doc.image(logo, x + 165, y + 100, { fit: [100, 100] })
            }

            entryCount++
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

function calculateStartX(
    desiredXCenter: number,
    text: string | null,
    doc: PDFKit.PDFDocument,
    fontSize = 12,
) {
    if (text !== null) {
        doc.font('Helvetica').fontSize(fontSize)
        const textWidth = doc.widthOfString(text)
        return desiredXCenter - textWidth / 2
    }
    return 0
}

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
