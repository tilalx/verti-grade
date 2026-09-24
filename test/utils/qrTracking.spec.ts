import { describe, expect, it } from 'vitest'
import QRCode from 'qrcode'
import {
    createTracker,
    cropTemplate,
    grayscale,
    matchTemplate,
    TRACKING_THRESHOLD,
} from '~/utils/qrTracking'

const WIDTH = 640
const HEIGHT = 360
const MODULE_PX = 6
const TAG_URL = 'https://routes.example/route?id=k3m9x2q7p1z8r4t'

function renderFrame({
    left = 0,
    top = 0,
    blur = 0,
    text = TAG_URL,
    withCode = true,
} = {}) {
    const qr = QRCode.create(text, { errorCorrectionLevel: 'Q' })
    const modules = qr.modules.size
    const luminance = new Float32Array(WIDTH * HEIGHT).fill(170)
    if (withCode) {
        for (let y = -12; y < modules * MODULE_PX + 12; y++) {
            for (let x = -12; x < modules * MODULE_PX + 12; x++) {
                const moduleX = Math.floor(x / MODULE_PX)
                const moduleY = Math.floor(y / MODULE_PX)
                const dark =
                    moduleX >= 0 &&
                    moduleY >= 0 &&
                    moduleX < modules &&
                    moduleY < modules &&
                    qr.modules.data[moduleY * modules + moduleX]
                luminance[(top + y) * WIDTH + left + x] = dark ? 20 : 240
            }
        }
    }

    const data = new Uint8ClampedArray(WIDTH * HEIGHT * 4)
    const steps = Math.max(1, blur)
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            let sum = 0
            for (let step = 0; step < steps; step++) {
                sum += luminance[y * WIDTH + Math.min(WIDTH - 1, x + step)]!
            }
            const offset = (y * WIDTH + x) * 4
            data[offset] = data[offset + 1] = data[offset + 2] = sum / steps
            data[offset + 3] = 255
        }
    }
    return { data, width: WIDTH, height: HEIGHT, size: modules * MODULE_PX }
}

function templateAt(left: number, top: number) {
    const frame = renderFrame({ left, top })
    const template = cropTemplate(grayscale(frame, 4), {
        x: left / 4,
        y: top / 4,
        width: frame.size / 4,
        height: frame.size / 4,
    })
    expect(template).not.toBeNull()
    return template!
}

describe('grayscale', () => {
    it('averages the green channel over each block', () => {
        const data = new Uint8ClampedArray([
            0, 10, 0, 255, 0, 30, 0, 255, 0, 50, 0, 255, 0, 70, 0, 255,
        ])
        const gray = grayscale({ data, width: 2, height: 2 }, 2)
        expect(gray.width).toBe(1)
        expect([...gray.data]).toEqual([40])
    })
})

describe('matchTemplate', () => {
    const template = templateAt(200, 80)

    it('finds the code after it moved', () => {
        const moved = grayscale(renderFrame({ left: 240, top: 100 }), 4)
        const match = matchTemplate(moved, template, 50, 20, 16)!
        expect(match.x * 4).toBe(240)
        expect(match.y * 4).toBe(100)
        expect(match.score).toBeLessThan(TRACKING_THRESHOLD)
    })

    it('still finds the code under strong motion blur', () => {
        const blurred = grayscale(
            renderFrame({ left: 240, top: 100, blur: 16 }),
            4,
        )
        const match = matchTemplate(blurred, template, 50, 20, 16)!
        expect(Math.abs(match.x * 4 - 240)).toBeLessThanOrEqual(12)
        expect(match.y * 4).toBe(100)
        expect(match.score).toBeLessThan(TRACKING_THRESHOLD)
    })

    it('rejects a frame without a code', () => {
        const empty = grayscale(renderFrame({ withCode: false }), 4)
        const match = matchTemplate(empty, template, 50, 20, 16)!
        expect(match.score).toBeGreaterThan(TRACKING_THRESHOLD)
    })
})

describe('createTracker', () => {
    const start = { left: 120, top: 80 }
    const startFrame = renderFrame(start)
    const decodedAtStart = [
        {
            rawValue: TAG_URL,
            boundingBox: {
                x: start.left,
                y: start.top,
                width: startFrame.size,
                height: startFrame.size,
            },
        },
    ]

    it('follows a blurred, moving code between decodes', () => {
        const tracker = createTracker(1000)
        tracker.update(startFrame, decodedAtStart, 0)

        for (let step = 1; step <= 5; step++) {
            const left = start.left + step * 12
            const followed = tracker.update(
                renderFrame({ left, top: start.top, blur: 16 }),
                [],
                step * 33,
            )
            expect(followed).toHaveLength(1)
            expect(followed[0]!.rawValue).toBe(TAG_URL)
            expect(
                Math.abs(followed[0]!.boundingBox.x - left),
            ).toBeLessThanOrEqual(12)
            expect(followed[0]!.boundingBox.y).toBe(start.top)
        }
    })

    it('gives up once the last decode is too old', () => {
        const tracker = createTracker(1000)
        tracker.update(startFrame, decodedAtStart, 0)
        expect(tracker.update(startFrame, [], 1001)).toEqual([])
        expect(tracker.size).toBe(0)
    })

    it('drops the code when a different code is decoded on top of it', () => {
        const tracker = createTracker(1000)
        tracker.update(startFrame, decodedAtStart, 0)
        const followed = tracker.update(
            startFrame,
            [{ ...decodedAtStart[0]!, rawValue: 'other' }],
            33,
        )
        expect(followed).toEqual([])
    })

    it('does not jump to a code outside its search window', () => {
        const tracker = createTracker(1000)
        tracker.update(startFrame, decodedAtStart, 0)
        const far = renderFrame({
            left: start.left + startFrame.size * 1.5,
            top: start.top,
        })
        expect(tracker.update(far, [], 33)).toEqual([])
    })
})
