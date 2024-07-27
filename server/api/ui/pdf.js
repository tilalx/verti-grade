import QRCode from 'qrcode'
import PDFDocument from 'pdfkit'
import { usePocketbase } from '~/composables/pocketbase'
import { createError } from 'h3'

export default eventHandler(async (event) => {
    const pb = usePocketbase()

    const res = event.node.res
    const req = event.node.req

    const host = req.headers.host || req.socket.remoteAddress

    try {
        const paramId = getQuery(event)

        const ids = paramId?.id ? paramId.id.split(',') : []
        if (ids.length === 0) {
            return createError({
                statusCode: 400,
                statusMessage: 'No IDs provided.',
            })
        }

        const settings = await pb
            .collection('settings')
            .getOne('settings_123456')

        const logoUrl = await pb.files.getUrl(settings, settings.sign_image)

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
            const climbingRoute = await pb.collection('routes').getOne(id, {})

            // Every 8 entries, add a new page
            if (entryCount % 8 === 0 && entryCount > 0) {
                doc.addPage()
            }

            const x = entryCount % 2 === 0 ? 25 : 310 // Position for 2 columns
            const y = (Math.floor(entryCount / 2) % 4) * 180 + 40 // Position for 4 rows

            // Draw a border around the entry
            doc.rect(x - 10, y - 10, 280, 170).stroke()

            // add color
            doc.circle(x + 80, y + 5, 10).fill(climbingRoute.color)

            //set text color black
            doc.fillColor('black')

            // Set text positions
            const textOptions = { align: 'left', width: 200 }
            doc.text(
                climbingRoute.name,
                calculateStartX(x + 80, climbingRoute.name, doc),
                y + 25,
                textOptions,
            )
            doc.fontSize(30).text(
                climbingRoute.difficulty + climbingRoute.difficulty_sign,
                x + 70,
                y + 45,
                textOptions,
            )
            doc.text(
                climbingRoute.comment,
                calculateStartX(x + 80, climbingRoute.comment, doc),
                y + 75,
                textOptions,
            )

            // Search for first and last name based on creatorId
            const creators = climbingRoute.creators || []
            if (Array.isArray(creators)) {
                doc.fontSize(8).text(
                    creators.join(' / '),
                    calculateStartX(x + 80, creators.join(' / '), doc),
                    y + 120,
                    textOptions,
                )
            }

            const date = new Date(climbingRoute.screw_date)
            const screw_date = date.toLocaleDateString('DE-de')
            doc.fontSize(8).text(
                screw_date,
                calculateStartX(x + 80, screw_date, doc),
                y + 140,
                textOptions,
            )

            // QR code positioning and scaling
            const qrX = x + 155 // X position for QR code (to the right of the text)
            const qrY = y - 15 // Y position for QR code
            const qrSize = 120 // Size of the QR code, adjust as necessary

            // Generate QR code with the server URL and the entry ID as a query parameter
            const serverUrl = settings.application_url + `/route?id=${id}`

            const qrCodeBuffer = await QRCode.toBuffer(serverUrl, {
                color: {
                    light: '#0000', // Transparent background
                },
            })
            doc.image(qrCodeBuffer, qrX, qrY, { fit: [qrSize, qrSize] })

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
        createError({ statusCode: 500, statusMessage: 'Server error' })
    }
})

// Function to calculate the starting X-coordinate for centered text
function calculateStartX(desiredXCenter, text, doc) {
    if (text !== null) {
        // Choose a font and font size for measuring
        doc.font('Helvetica').fontSize(12)

        // Measure the width of the text
        const textWidth = doc.widthOfString(text)
        // Calculate and return the starting X position for the centered text
        return desiredXCenter - textWidth / 2
    }
    return 0
}

async function fetchLogo(url) {
    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error('Failed to fetch logo')
        }
        const logoBuffer = await response.arrayBuffer()
        return logoBuffer
    } catch (error) {
        console.error(error)
        throw new Error('Failed to fetch logo')
    }
}
