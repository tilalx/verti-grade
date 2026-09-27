import type { MapBounds, MapPoint, ViewBox } from '#shared/utils/mapGeometry'

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
