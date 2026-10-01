import {
    fitViewBox,
    type MapBounds,
    type MapPoint,
    type ViewBox,
} from '#shared/utils/mapGeometry'

export interface ZoomLimits {
    minWidth: number
    maxWidth: number
}

export interface ScreenRect {
    left: number
    top: number
    width: number
    height: number
}

export function screenToMap(
    client: { x: number; y: number },
    rect: ScreenRect,
    view: ViewBox,
): MapPoint {
    return [
        view.x + ((client.x - rect.left) / rect.width) * view.width,
        view.y + ((client.y - rect.top) / rect.height) * view.height,
    ]
}

export function mapToScreen(
    point: MapPoint,
    rect: Pick<ScreenRect, 'width' | 'height'>,
    view: ViewBox,
): { x: number; y: number } {
    return {
        x: ((point[0] - view.x) / view.width) * rect.width,
        y: ((point[1] - view.y) / view.height) * rect.height,
    }
}

export function withAspect(view: ViewBox, aspectRatio: number): ViewBox {
    const height = view.width / aspectRatio
    return {
        ...view,
        y: view.y + (view.height - height) / 2,
        height,
    }
}

export function zoomAt(
    view: ViewBox,
    focus: MapPoint,
    factor: number,
    limits: ZoomLimits,
): ViewBox {
    const width = Math.min(
        limits.maxWidth,
        Math.max(limits.minWidth, view.width / factor),
    )
    const ratio = width / view.width
    return {
        x: focus[0] - (focus[0] - view.x) * ratio,
        y: focus[1] - (focus[1] - view.y) * ratio,
        width,
        height: view.height * ratio,
    }
}

export function panBy(view: ViewBox, dx: number, dy: number): ViewBox {
    return { ...view, x: view.x + dx, y: view.y + dy }
}

export const PAN_SLACK = 0.35

export function clampToBounds(view: ViewBox, bounds: MapBounds): ViewBox {
    const slackX = view.width * PAN_SLACK
    const slackY = view.height * PAN_SLACK
    const centerX = Math.min(
        bounds.maxX + slackX,
        Math.max(bounds.minX - slackX, view.x + view.width / 2),
    )
    const centerY = Math.min(
        bounds.maxY + slackY,
        Math.max(bounds.minY - slackY, view.y + view.height / 2),
    )
    return {
        ...view,
        x: centerX - view.width / 2,
        y: centerY - view.height / 2,
    }
}

export function interpolateView(
    from: ViewBox,
    to: ViewBox,
    progress: number,
): ViewBox {
    const eased = 1 - Math.pow(1 - progress, 3)
    const mix = (a: number, b: number) => a + (b - a) * eased
    return {
        x: mix(from.x, to.x),
        y: mix(from.y, to.y),
        width: mix(from.width, to.width),
        height: mix(from.height, to.height),
    }
}

export interface ScreenPoint {
    x: number
    y: number
}

const midpoint = (a: ScreenPoint, b: ScreenPoint) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
})

export function pinchView(
    view: ViewBox,
    rect: ScreenRect,
    before: [ScreenPoint, ScreenPoint],
    after: [ScreenPoint, ScreenPoint],
    limits: ZoomLimits,
): ViewBox {
    const startDistance = Math.hypot(
        before[0].x - before[1].x,
        before[0].y - before[1].y,
    )
    const endDistance = Math.hypot(
        after[0].x - after[1].x,
        after[0].y - after[1].y,
    )
    const from = midpoint(...before)
    const to = midpoint(...after)
    const zoomed =
        startDistance > 0
            ? zoomAt(
                  view,
                  screenToMap(from, rect, view),
                  endDistance / startDistance,
                  limits,
              )
            : view
    const unitsPerPixel = zoomed.width / rect.width
    return panBy(
        zoomed,
        (from.x - to.x) * unitsPerPixel,
        (from.y - to.y) * unitsPerPixel,
    )
}

export const FLING_MIN_SPEED = 0.05
const FLING_FRICTION_PER_FRAME = 0.92
const FRAME_MS = 16

export function flingVelocity(
    velocity: ScreenPoint,
    elapsedMs: number,
): ScreenPoint | null {
    const decay = Math.pow(FLING_FRICTION_PER_FRAME, elapsedMs / FRAME_MS)
    const next = { x: velocity.x * decay, y: velocity.y * decay }
    return Math.hypot(next.x, next.y) < FLING_MIN_SPEED ? null : next
}

const MOUSE_WHEEL_STEP = 50

export function wheelIntent(event: {
    deltaX: number
    deltaY: number
    deltaMode: number
    ctrlKey: boolean
}): 'zoom' | 'pan' {
    if (event.ctrlKey || event.deltaMode !== 0) return 'zoom'
    if (event.deltaX !== 0) return 'pan'
    return Math.abs(event.deltaY) >= MOUSE_WHEEL_STEP ? 'zoom' : 'pan'
}

export function fitBetweenInsets(
    bounds: MapBounds,
    size: { width: number; height: number },
    padding: number,
    insets: { top: number; bottom: number },
): ViewBox {
    const visibleHeight = Math.max(
        size.height - insets.top - insets.bottom,
        size.height / 4,
    )
    const view = fitViewBox(bounds, size.width / visibleHeight, padding)
    const unitsPerPixel = view.height / visibleHeight
    return {
        ...view,
        y: view.y - insets.top * unitsPerPixel,
        height: size.height * unitsPerPixel,
    }
}
