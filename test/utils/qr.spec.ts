import { describe, expect, it } from 'vitest'
import {
    boundingBoxOf,
    downsampleHalf,
    mapToCover,
    predictBox,
    tagPosition,
} from '~/utils/qr'

describe('mapToCover', () => {
    it('crops a landscape video horizontally in a portrait box', () => {
        const box = mapToCover(
            { x: 960, y: 540, width: 100, height: 100 },
            { width: 1920, height: 1080 },
            { width: 400, height: 450 },
        )
        const scale = 450 / 1080
        expect(box.x).toBeCloseTo(200)
        expect(box.y).toBeCloseTo(225)
        expect(box.width).toBeCloseTo(100 * scale)
        expect(box.height).toBeCloseTo(100 * scale)
    })

    it('crops a portrait video vertically in a landscape box', () => {
        const box = mapToCover(
            { x: 0, y: 0, width: 10, height: 10 },
            { width: 100, height: 200 },
            { width: 300, height: 300 },
        )
        expect(box).toEqual({ x: 0, y: -150, width: 30, height: 30 })
    })

    it('keeps fractional coordinates', () => {
        const box = mapToCover(
            { x: 1, y: 1, width: 1, height: 1 },
            { width: 3, height: 3 },
            { width: 10, height: 10 },
        )
        expect(box.x).toBeCloseTo(10 / 3)
        expect(box.width).toBeCloseTo(10 / 3)
    })
})

describe('boundingBoxOf', () => {
    it('encloses rotated corner points', () => {
        expect(
            boundingBoxOf([
                { x: 50, y: 10 },
                { x: 90, y: 50 },
                { x: 50, y: 90 },
                { x: 10, y: 50 },
            ]),
        ).toEqual({ x: 10, y: 10, width: 80, height: 80 })
    })
})

describe('predictBox', () => {
    const previous = { box: { x: 0, y: 0, width: 50, height: 50 }, at: 0 }
    const latest = { box: { x: 10, y: 20, width: 50, height: 50 }, at: 100 }

    it('extrapolates along the last movement', () => {
        expect(predictBox(latest, previous, 150, 200)).toEqual({
            x: 15,
            y: 30,
            width: 50,
            height: 50,
        })
    })

    it('caps how far ahead it predicts', () => {
        expect(predictBox(latest, previous, 1000, 100).x).toBe(20)
    })

    it('stays put without a previous sample', () => {
        expect(predictBox(latest, undefined, 150, 200)).toEqual(latest.box)
    })
})

describe('tagPosition', () => {
    const display = { width: 300, height: 300 }
    const tag = { width: 100, height: 26 }

    it('centers the tag below the box', () => {
        expect(
            tagPosition(
                { x: 100, y: 50, width: 100, height: 100 },
                tag,
                display,
                6,
            ),
        ).toEqual({ x: 100, y: 156 })
    })

    it('moves the tag above when there is no room below', () => {
        expect(
            tagPosition(
                { x: 100, y: 180, width: 100, height: 100 },
                tag,
                display,
                6,
            ),
        ).toEqual({ x: 100, y: 148 })
    })

    it('keeps the tag inside the display horizontally', () => {
        expect(
            tagPosition(
                { x: 260, y: 50, width: 40, height: 40 },
                tag,
                display,
                6,
            ).x,
        ).toBe(194)
    })
})

describe('downsampleHalf', () => {
    it('averages each 2x2 block', () => {
        const pixel = (value: number) => [value, value, value, 255]
        const data = new Uint8ClampedArray([
            ...pixel(0),
            ...pixel(100),
            ...pixel(10),
            ...pixel(10),
            ...pixel(200),
            ...pixel(100),
            ...pixel(10),
            ...pixel(10),
        ])
        const result = downsampleHalf({ data, width: 4, height: 2 })
        expect(result.width).toBe(2)
        expect(result.height).toBe(1)
        expect([...result.data]).toEqual([100, 100, 100, 255, 10, 10, 10, 255])
    })
})
