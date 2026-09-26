import {
    formatDate,
    formatDifficulty,
    normalizeCreators,
} from '#shared/utils/formatting'
import type { RouteRecord } from '../../types/models'

export const TAG_WIDTH = 280
export const TAG_HEIGHT = 170
export const TAG_PADDING = 10

const TEXT_WIDTH = 150
const QR_SIZE = 110
const CIRCLE_RADIUS = 12
const CIRCLE_BORDER = 1.5

export interface RouteTagOptions {
    anchorLabel: string
    locale: string
    qrCode: Buffer
    logo: Buffer | null
    show: { creators: boolean; date: boolean; logo: boolean }
}

interface TextSlot {
    text: string
    y: number
    font?: 'Sans' | 'Sans-Bold'
    size: number
    minSize?: number
    lines?: number
    x?: number
    width?: number
}

function drawText(doc: PDFKit.PDFDocument, originX: number, slot: TextSlot) {
    const width = slot.width ?? TEXT_WIDTH
    let size = slot.size
    doc.font(slot.font ?? 'Sans').fontSize(size)
    while (
        size > (slot.minSize ?? size) &&
        doc.widthOfString(slot.text) > width
    ) {
        doc.fontSize(--size)
    }
    doc.text(slot.text, originX + (slot.x ?? 0), slot.y, {
        width,
        height: doc.currentLineHeight(true) * (slot.lines ?? 1),
        align: 'center',
        ellipsis: true,
    })
}

export function drawRouteTag(
    doc: PDFKit.PDFDocument,
    route: RouteRecord,
    x: number,
    y: number,
    options: RouteTagOptions,
) {
    doc.rect(x - TAG_PADDING, y - TAG_PADDING, TAG_WIDTH, TAG_HEIGHT).stroke()
    doc.fillColor('black')

    const anchor = String(route.anchor_point ?? '').trim()
    if (anchor && anchor !== '0') {
        drawText(doc, x, {
            text: options.anchorLabel,
            y,
            size: 8,
            minSize: 6,
            x: 50,
            width: 50,
        })
        drawText(doc, x, {
            text: anchor,
            y: y + 11,
            font: 'Sans-Bold',
            size: 12,
            x: 50,
            width: 50,
        })
    }

    drawText(doc, x, {
        text: route.name ?? '',
        y: y + 30,
        size: 12,
        minSize: 8,
    })
    drawText(doc, x, {
        text: formatDifficulty(route),
        y: y + 46,
        size: 40,
        minSize: 24,
    })
    drawText(doc, x, {
        text: route.comment ?? '',
        y: y + 95,
        size: 10,
        lines: 2,
    })

    const creators = normalizeCreators(route.creator).join(' / ')
    if (options.show.creators && creators) {
        drawText(doc, x, { text: creators, y: y + 124, size: 8, minSize: 6 })
    }
    if (options.show.date) {
        drawText(doc, x, {
            text: formatDate(route.screw_date, { locale: options.locale }),
            y: y + 138,
            size: 8,
        })
    }

    const qrX = x + 159
    const qrY = y - 9
    doc.image(options.qrCode, qrX, qrY, { width: QR_SIZE, height: QR_SIZE })

    const cx = qrX + QR_SIZE / 2
    const cy = qrY + QR_SIZE / 2
    doc.circle(cx, cy, CIRCLE_RADIUS + CIRCLE_BORDER + 1).fill('#FFFFFF')
    doc.circle(cx, cy, CIRCLE_RADIUS + CIRCLE_BORDER).fill('#333333')
    doc.circle(cx, cy, CIRCLE_RADIUS + 0.5).fill('#FFFFFF')
    doc.circle(cx, cy, CIRCLE_RADIUS).fill(route.color as string)
    doc.fillColor('black')

    if (options.show.logo && options.logo) {
        doc.image(options.logo, x + 165, y + 105, { fit: [100, 50] })
    }
}
