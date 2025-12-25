import { eventHandler, getQuery, readBody, createError } from 'h3'
import { createPocketBase } from '../../utils/pb-server.js';

export default eventHandler(async (event) => {
    const { default: QRCode } = await import('qrcode')
    const { default: PDFDocument } = await import('pdfkit')
    const pb = createPocketBase();
    const res = event.node.res

    try {
        const ids = await resolveRouteIds(event)
        if (ids.length === 0) {
            return createError({
                statusCode: 400,
                statusMessage: 'No IDs provided.',
            })
        }

        const settings = await pb
            .collection('settings')
            .getOne('settings_123456')

        const logoUrl = await pb.files.getURL(settings, settings.sign_image)
        const logo = await fetchLogo(logoUrl)

        if (!logo) {
            return createError({
                statusCode: 500,
                statusMessage: 'Failed to fetch logo.',
            })
        }

        if (!settings.application_url) {
            return createError({
                statusCode: 500,
                statusMessage: 'No application url provided.',
            })
        }

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

            const x = entryCount % 2 === 0 ? 20 : 315 // Position for 2 columns
            const y = (Math.floor(entryCount / 2) % 4) * 193 + 30 // Position for 4 rows

            // Draw a border around the entry
            doc.rect(x - 10, y - 10, 280, 170).stroke()

            // Set text color black
            doc.fillColor('black')

            // Set text positions
            const textOptions = { align: 'left', width: 200 }
            let sign = ''

            if (typeof climbingRoute.difficulty_sign === 'string') {
                sign = climbingRoute.difficulty_sign.trim()
            } else if (typeof climbingRoute.difficulty_sign === 'boolean') {
                // interpret boolean true as "+" and false as "-"
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

            // Add small anchor number in top-left corner (if exists)
            if (climbingRoute.anchor_point !== null && climbingRoute.anchor_point !== undefined && climbingRoute.anchor_point !== 0) {
                const anchorValue = String(climbingRoute.anchor_point).trim()

                // Box dimensions and position — aligned mid-height with name
                const boxWidth = 32
                const boxX = x + 65     // small gap from left border
                const boxY = y + 5   // moved slightly lower for better alignment with name line

                // Centered "Seil" label
                doc.font('Helvetica').fontSize(8).fillColor('black')
                    .text('Seil', boxX, boxY + 4, {
                        width: boxWidth,
                        align: 'center',
                    })

                // Centered bold anchor number below label
                doc.font('Helvetica-Bold').fontSize(12)
                    .text(anchorValue, boxX, boxY + 12, {
                        width: boxWidth,
                        align: 'center',
                    })
            }

            // Creator names
            const creators = climbingRoute.creator || []
            if (Array.isArray(creators)) {
                doc.fontSize(8).text(
                    creators.join(' / '),
                    calculateStartX(x + 80, creators.join(' / '), doc),
                    y + 130,
                    textOptions,
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

            // QR code positioning and scaling
            const qrX = x + 155 // X position for QR code
            const qrY = y - 15 // Y position for QR code
            const qrSize = 120 // Size of the QR code

            // Generate QR code with the server URL and the entry ID
            const serverUrl = settings.application_url + `/route?id=${id}`
            const qrCodeBuffer = await QRCode.toBuffer(serverUrl, {
                color: { light: '#0000' }, // Transparent background
            })
            doc.image(qrCodeBuffer, qrX, qrY, { fit: [qrSize, qrSize] })

            // Add color circle
            doc.circle(x + 215, y + 45, 15).fill("#FFFFFF")
            doc.circle(x + 215, y + 45, 14).fill(climbingRoute.color)


            // Add logo
            doc.image(logo, {
                fit: [100, 100],
                y: y + 100,
                x: x + 165,
            })

            entryCount++
        }

        doc.end()
    } catch (error) {
        console.error(error)
        return createError({ statusCode: 500, statusMessage: 'Server error' })
    }
})

// Function to calculate the starting X-coordinate for centered text
function calculateStartX(desiredXCenter, text, doc, fontSize = 12) {
    if (text !== null) {
        doc.font('Helvetica').fontSize(fontSize)
        const textWidth = doc.widthOfString(text)
        return desiredXCenter - textWidth / 2
    }
    return 0
}

// Helper to fetch the logo as a buffer
async function fetchLogo(url) {
    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch logo')
        const logoBuffer = await response.arrayBuffer()
        return logoBuffer
    } catch (error) {
        console.error(error)
        throw new Error('Failed to fetch logo')
    }
}

async function resolveRouteIds(event) {
    try {
        const body = await readBody(event)
        if (body && Array.isArray(body.ids)) {
            return body.ids
                .map((value) => (typeof value === 'string' ? value.trim() : ''))
                .filter(Boolean)
        }
    } catch (error) {
        // ignore body parsing errors and fallback to query string
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