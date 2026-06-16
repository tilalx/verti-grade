import { eventHandler, createError, getRequestURL } from 'h3'
import { getAuthenticatedPb } from '../../utils/pb-server.js'
import { resolveRouteIds } from '../../utils/export.js'

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
            .getOne('settings_123456')

        // The sign image is optional — if none is configured (or it fails to
        // load), the PDF is still generated without the logo.
        let logo = null
        if (settings.sign_image) {
            const logoUrl = pb.files.getURL(settings, settings.sign_image)
            logo = await fetchLogo(logoUrl)
        }

        // Prefer the configured application URL; otherwise fall back to the
        // origin of the incoming request (e.g. localhost in dev, the real
        // host such as https://dav.aelx.de in production behind the proxy).
        const applicationUrl = (
            settings.application_url ||
            getRequestURL(event, {
                xForwardedHost: true,
                xForwardedProto: true,
            }).origin
        ).replace(/\/+$/, '')

        // ── Layout constants ───────────────────────────────────────────────
        const QR_SIZE = 110 // Rendered size of the QR code in PDF points (square)
        const QR_PX = 330 // Pixel size of the generated QR image (3× for sharpness)

        // Color circle — centered on the QR code.
        // Error correction H (30%) supports up to ~15pt radius safely at QR_SIZE=110.
        const CIRCLE_RADIUS = 12 // Radius of the route color circle
        const CIRCLE_BORDER = 1.5 // Dark outline for light-color visibility
        // ──────────────────────────────────────────────────────────────────

        const doc = new PDFDocument({ size: [595.28, 841.89] })
        res.setHeader('Content-Type', 'application/pdf')
        doc.pipe(res)

        let entryCount = 0

        for (let id of ids) {
            const climbingRoute = await pb.collection('routes').getOne(id)

            // Every 8 entries, add a new page
            if (entryCount % 8 === 0 && entryCount > 0) {
                doc.addPage()
            }

            const x = entryCount % 2 === 0 ? 20 : 315
            const y = (Math.floor(entryCount / 2) % 4) * 193 + 30

            // Draw a border around the entry
            doc.rect(x - 10, y - 10, 280, 170).stroke()

            doc.fillColor('black')

            const textOptions = { align: 'left', width: 200 }
            let sign = ''

            if (typeof climbingRoute.difficulty_sign === 'string') {
                sign = climbingRoute.difficulty_sign.trim()
            } else if (typeof climbingRoute.difficulty_sign === 'boolean') {
                sign = climbingRoute.difficulty_sign ? '+' : '-'
            }

            const difficulty = climbingRoute.difficulty + sign

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
                climbingRoute.comment,
                calculateStartX(x + 80, climbingRoute.comment, doc),
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
                    .text('Seil', boxX, boxY + 4, {
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

            // Creator names — shrink font if the list is long
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

            // Screw date
            const date = new Date(climbingRoute.screw_date)
            const screw_date = date.toLocaleDateString('DE-de')
            doc.fontSize(8).text(
                screw_date,
                calculateStartX(x + 80, screw_date, doc),
                y + 145,
                textOptions,
            )

            // ── QR code ────────────────────────────────────────────────────
            // width/height (not fit:[]) guarantees exact QR_SIZE × QR_SIZE
            // so the circle center calculation is always precise.
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

            // White clearing disc
            doc.circle(cx, cy, CIRCLE_RADIUS + CIRCLE_BORDER + 1).fill(
                '#FFFFFF',
            )
            // Dark outline ring
            doc.circle(cx, cy, CIRCLE_RADIUS + CIRCLE_BORDER).fill('#333333')
            // Thin white gap
            doc.circle(cx, cy, CIRCLE_RADIUS + 0.5).fill('#FFFFFF')
            // Route color fill
            doc.circle(cx, cy, CIRCLE_RADIUS).fill(climbingRoute.color)
            // ──────────────────────────────────────────────────────────────

            if (logo) {
                doc.image(logo, {
                    fit: [100, 100],
                    y: y + 100,
                    x: x + 165,
                })
            }

            entryCount++
        }

        doc.end()
    } catch (error) {
        console.error(error)
        throw createError({ statusCode: 500, statusMessage: 'Server error' })
    }
})

function calculateStartX(desiredXCenter, text, doc, fontSize = 12) {
    if (text !== null) {
        doc.font('Helvetica').fontSize(fontSize)
        const textWidth = doc.widthOfString(text)
        return desiredXCenter - textWidth / 2
    }
    return 0
}

async function fetchLogo(url) {
    if (!url) {
        return null
    }
    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch logo')
        return await response.arrayBuffer()
    } catch (error) {
        console.error('Failed to fetch logo:', error)
        return null
    }
}
