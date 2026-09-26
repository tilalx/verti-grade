// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import {
    drawRouteTag,
    TAG_HEIGHT,
    TAG_PADDING,
    TAG_WIDTH,
} from '../../server/utils/routeTag'
import type { RouteRecord } from '../../types/models'
import de from '../../i18n/locales/de.json'
import en from '../../i18n/locales/en.json'
import ru from '../../i18n/locales/ru.json'
import tr from '../../i18n/locales/tr.json'
import uk from '../../i18n/locales/uk.json'

interface Box {
    label: string
    x: number
    y: number
    width: number
    height: number
}

const overlaps = (a: Box, b: Box) =>
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height

const LOCALES = { en, de, ru, tr, uk }

const LONG_TEXT: Record<string, string> = {
    en: 'Overhanging crimp traverse into the big roof finish',
    de: 'Überhängende Leistenquerung bis zum großen Dachausstieg',
    ru: 'Нависающий траверс по мелким зацепам до большого карниза',
    tr: 'Büyük çatı çıkışına kadar sarkan kenar geçişi İğüşöç',
    uk: 'Нависаючий траверс по дрібних зачепах до великого карнизу',
}

const TAG_X = 20
const TAG_Y = 30

async function drawTag(locale: keyof typeof LOCALES) {
    const doc = new PDFDocument({ size: [595.28, 841.89] })
    doc.registerFont(
        'Sans',
        readFileSync('server/assets/fonts/Roboto-Regular.ttf'),
    )
    doc.registerFont(
        'Sans-Bold',
        readFileSync('server/assets/fonts/Roboto-Bold.ttf'),
    )

    const texts: (Box & { fits: boolean })[] = []
    const images: Box[] = []

    const drawText = doc.text.bind(doc)
    doc.text = ((
        text: string,
        x: number,
        y: number,
        options: PDFKit.Mixins.TextOptions,
    ) => {
        const width = options.width!
        texts.push({
            label: text,
            x,
            y,
            width,
            height: Math.min(
                doc.heightOfString(text, { ...options, height: undefined }),
                options.height ?? Infinity,
            ),
            fits: doc.widthOfString(text) <= width,
        })
        return drawText(text, x, y, options)
    }) as typeof doc.text

    const drawImage = doc.image.bind(doc)
    doc.image = ((
        src: Buffer,
        x: number,
        y: number,
        options: PDFKit.Mixins.ImageOption,
    ) => {
        const [width, height] = options.fit ?? [options.width!, options.height!]
        images.push({ label: 'image', x, y, width, height })
        return drawImage(src, x, y, options)
    }) as typeof doc.image

    const png = await QRCode.toBuffer('https://example.com/route?id=abc')
    const text = LONG_TEXT[locale]
    const route = {
        id: 'abc',
        name: text,
        comment: `${text}. ${text}.`,
        grade: '10+',
        grade_system: 'uiaa',
        anchor_point: 12,
        creator: ['Александра Константинопольская', 'Gülşen Öztürk', text],
        screw_date: '2026-12-28 12:00:00.000Z',
        color: '#ff0000',
    } as unknown as RouteRecord

    drawRouteTag(doc, route, TAG_X, TAG_Y, {
        anchorLabel: LOCALES[locale].climbing.anchor_point,
        locale,
        qrCode: png,
        logo: png,
        show: { creators: true, date: true, logo: true },
    })
    doc.end()
    return { texts, images }
}

describe('route tag pdf layout', () => {
    it.each(Object.keys(LOCALES) as (keyof typeof LOCALES)[])(
        '%s text stays inside the tag without overlapping',
        async (locale) => {
            const { texts, images } = await drawTag(locale)
            const frame: Box = {
                label: 'frame',
                x: TAG_X - TAG_PADDING,
                y: TAG_Y - TAG_PADDING,
                width: TAG_WIDTH,
                height: TAG_HEIGHT,
            }

            expect(texts).toHaveLength(7)
            for (const box of [...texts, ...images]) {
                expect(box.x).toBeGreaterThanOrEqual(frame.x)
                expect(box.y).toBeGreaterThanOrEqual(frame.y)
                expect(box.x + box.width).toBeLessThanOrEqual(
                    frame.x + frame.width,
                )
                expect(box.y + box.height).toBeLessThanOrEqual(
                    frame.y + frame.height,
                )
            }
            for (const [index, box] of texts.entries()) {
                for (const other of [...texts.slice(index + 1), ...images]) {
                    expect(
                        overlaps(box, other),
                        `"${box.label}" overlaps "${other.label}"`,
                    ).toBe(false)
                }
            }
        },
    )

    it.each(Object.keys(LOCALES) as (keyof typeof LOCALES)[])(
        '%s anchor label, grade and date are never truncated',
        async (locale) => {
            const { texts } = await drawTag(locale)
            const [anchorLabel, anchorValue, , grade] = texts
            const date = texts.at(-1)!

            for (const box of [anchorLabel, anchorValue, grade, date]) {
                expect(box.fits, `"${box.label}" is cut off`).toBe(true)
            }
        },
    )
})
