import type { MapPoint } from '#shared/utils/mapGeometry'

export function svgPath(points: MapPoint[], closed = true): string {
    if (!points.length) return ''
    const [first, ...rest] = points
    const segments = rest.map(([x, y]) => `L${x} ${y}`).join(' ')
    return `M${first![0]} ${first![1]} ${segments}${closed ? ' Z' : ''}`
}
