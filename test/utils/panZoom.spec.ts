import { describe, expect, it } from 'vitest'
import {
    clampToBounds,
    fitBetweenInsets,
    flingVelocity,
    pinchView,
    wheelIntent,
    interpolateView,
    mapToScreen,
    panBy,
    screenToMap,
    withAspect,
    zoomAt,
} from '~/utils/panZoom'

const view = { x: 10, y: 20, width: 40, height: 30 }
const rect = { left: 100, top: 50, width: 400, height: 300 }
const limits = { minWidth: 2, maxWidth: 80 }

describe('coordinate conversion', () => {
    it('maps screen pixels to map units and back', () => {
        expect(screenToMap({ x: 300, y: 200 }, rect, view)).toEqual([30, 35])
        expect(mapToScreen([30, 35], rect, view)).toEqual({ x: 200, y: 150 })
    })
})

describe('zoomAt', () => {
    it('keeps the focus point fixed on screen', () => {
        const zoomed = zoomAt(view, [20, 30], 2, limits)
        expect(zoomed).toEqual({ x: 15, y: 25, width: 20, height: 15 })
    })

    it('respects zoom limits', () => {
        expect(zoomAt(view, [20, 30], 100, limits).width).toBe(2)
        expect(zoomAt(view, [20, 30], 0.01, limits).width).toBe(80)
    })
})

describe('view adjustments', () => {
    it('pans in map units', () => {
        expect(panBy(view, 5, -5)).toEqual({ ...view, x: 15, y: 15 })
    })

    it('lets the map travel until its edge nears the screen edge', () => {
        const bounds = { minX: 0, minY: 0, maxX: 40, maxY: 30 }
        const clamped = clampToBounds({ ...view, x: 100, y: -100 }, bounds)
        expect(clamped.x + clamped.width / 2).toBe(40 + 40 * 0.35)
        expect(clamped.y + clamped.height / 2).toBeCloseTo(-30 * 0.35)
    })

    it('matches the element aspect ratio around the same centre', () => {
        expect(withAspect(view, 2)).toEqual({
            x: 10,
            y: 25,
            width: 40,
            height: 20,
        })
    })

    it('eases between two views', () => {
        const target = { x: 0, y: 0, width: 10, height: 10 }
        expect(interpolateView(view, target, 0)).toEqual(view)
        expect(interpolateView(view, target, 1)).toEqual(target)
    })
})

describe('pinchView', () => {
    const screen = { left: 0, top: 0, width: 400, height: 300 }

    it('zooms around the fingers and follows them when they move', () => {
        const pinched = pinchView(
            view,
            screen,
            [
                { x: 100, y: 150 },
                { x: 300, y: 150 },
            ],
            [
                { x: 0, y: 150 },
                { x: 400, y: 150 },
            ],
            limits,
        )
        expect(pinched.width).toBe(20)
        expect(screenToMap({ x: 200, y: 150 }, screen, pinched)).toEqual(
            screenToMap({ x: 200, y: 150 }, screen, view),
        )

        const moved = pinchView(
            view,
            screen,
            [
                { x: 100, y: 100 },
                { x: 200, y: 100 },
            ],
            [
                { x: 150, y: 100 },
                { x: 250, y: 100 },
            ],
            limits,
        )
        expect(moved).toEqual({ ...view, x: 5 })
    })
})

describe('flingVelocity', () => {
    it('slows down and eventually stops', () => {
        const next = flingVelocity({ x: 1, y: 0 }, 16)!
        expect(next.x).toBeLessThan(1)
        expect(flingVelocity({ x: 1, y: 0 }, 2000)).toBeNull()
    })
})

describe('wheelIntent', () => {
    const wheel = { deltaX: 0, deltaY: 0, deltaMode: 0, ctrlKey: false }

    it('zooms for mouse wheels and trackpad pinches, pans for two-finger scroll', () => {
        expect(wheelIntent({ ...wheel, deltaY: 100 })).toBe('zoom')
        expect(wheelIntent({ ...wheel, deltaY: 3, deltaMode: 1 })).toBe('zoom')
        expect(wheelIntent({ ...wheel, deltaY: 4, ctrlKey: true })).toBe('zoom')
        expect(wheelIntent({ ...wheel, deltaY: 12 })).toBe('pan')
        expect(wheelIntent({ ...wheel, deltaX: 30, deltaY: 120 })).toBe('pan')
    })
})

describe('fitBetweenInsets', () => {
    it('fits the bounds between the chips on top and the sheet below', () => {
        const bounds = { minX: 0, minY: 0, maxX: 40, maxY: 30 }
        const size = { width: 400, height: 600 }
        const fitted = fitBetweenInsets(bounds, size, 0, {
            top: 60,
            bottom: 300,
        })
        expect(mapToScreen([20, 0], size, fitted).y).toBeGreaterThanOrEqual(60)
        expect(mapToScreen([20, 30], size, fitted).y).toBeLessThanOrEqual(300)
        expect(fitted.height / fitted.width).toBeCloseTo(600 / 400)
    })
})
