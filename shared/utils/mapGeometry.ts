export type MapPoint = [number, number]

export const MAP_SHAPE_KINDS = ['floor', 'mat', 'structure'] as const
export type MapShapeKind = (typeof MAP_SHAPE_KINDS)[number]

export interface MapShape {
    kind: MapShapeKind
    points: MapPoint[]
}

export interface MapTrace {
    x: number
    y: number
    width: number
    opacity: number
}

export interface GymMap {
    width: number
    height: number
    shapes: MapShape[]
    trace?: MapTrace | null
}

export interface WallGeometry {
    outline: MapPoint[]
    edge: MapPoint[]
    label: MapPoint | null
}

export interface MapBounds {
    minX: number
    minY: number
    maxX: number
    maxY: number
}

export interface ViewBox {
    x: number
    y: number
    width: number
    height: number
}

export interface EdgeProjection {
    position: number
    distance: number
    point: MapPoint
}

export const MAP_LIMITS = {
    minSize: 5,
    maxSize: 500,
    maxShapes: 300,
    maxPoints: 200,
    shapeMinPoints: 3,
    edgeMinPoints: 2,
} as const

export const DEFAULT_MAP_WIDTH = 40
export const DEFAULT_MAP_HEIGHT = 30

export const roundToCm = (value: number) => Math.round(value * 100) / 100

export const distance = (a: MapPoint, b: MapPoint) =>
    Math.hypot(b[0] - a[0], b[1] - a[1])

export function polylineLength(points: MapPoint[]): number {
    let length = 0
    for (let index = 1; index < points.length; index++) {
        length += distance(points[index - 1]!, points[index]!)
    }
    return length
}

export function pointAt(points: MapPoint[], position: number): MapPoint {
    const [first] = points
    if (!first) return [0, 0]
    const target = clampUnit(position) * polylineLength(points)
    let walked = 0
    for (let index = 1; index < points.length; index++) {
        const start = points[index - 1]!
        const end = points[index]!
        const segment = distance(start, end)
        if (walked + segment >= target && segment > 0) {
            const ratio = (target - walked) / segment
            return [
                start[0] + (end[0] - start[0]) * ratio,
                start[1] + (end[1] - start[1]) * ratio,
            ]
        }
        walked += segment
    }
    return [...points[points.length - 1]!]
}

export function projectOntoPolyline(
    points: MapPoint[],
    point: MapPoint,
): EdgeProjection | null {
    const length = polylineLength(points)
    if (points.length < 2 || length === 0) return null
    let best: EdgeProjection | null = null
    let walked = 0
    for (let index = 1; index < points.length; index++) {
        const start = points[index - 1]!
        const end = points[index]!
        const segment = distance(start, end)
        const ratio =
            segment === 0
                ? 0
                : clampUnit(
                      ((point[0] - start[0]) * (end[0] - start[0]) +
                          (point[1] - start[1]) * (end[1] - start[1])) /
                          (segment * segment),
                  )
        const projected: MapPoint = [
            start[0] + (end[0] - start[0]) * ratio,
            start[1] + (end[1] - start[1]) * ratio,
        ]
        const gap = distance(projected, point)
        if (!best || gap < best.distance) {
            best = {
                position: (walked + segment * ratio) / length,
                distance: gap,
                point: projected,
            }
        }
        walked += segment
    }
    return best
}

export function nearestWall<Wall extends { edge: MapPoint[] }>(
    walls: Wall[],
    point: MapPoint,
    maxDistance: number,
): (EdgeProjection & { wall: Wall }) | null {
    let best: (EdgeProjection & { wall: Wall }) | null = null
    for (const wall of walls) {
        const projection = projectOntoPolyline(wall.edge, point)
        if (!projection || projection.distance > maxDistance) continue
        if (!best || projection.distance < best.distance) {
            best = { ...projection, wall }
        }
    }
    return best
}

export function boundsOf(points: MapPoint[]): MapBounds | null {
    if (!points.length) return null
    const xs = points.map(([x]) => x)
    const ys = points.map(([, y]) => y)
    return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
    }
}

export function fitViewBox(
    bounds: MapBounds,
    aspectRatio: number,
    padding: number,
): ViewBox {
    let width = Math.max(bounds.maxX - bounds.minX, 0.01) + padding * 2
    let height = Math.max(bounds.maxY - bounds.minY, 0.01) + padding * 2
    if (width / height > aspectRatio) height = width / aspectRatio
    else width = height * aspectRatio
    return {
        x: (bounds.minX + bounds.maxX) / 2 - width / 2,
        y: (bounds.minY + bounds.maxY) / 2 - height / 2,
        width,
        height,
    }
}

export function pointInPolygon(point: MapPoint, polygon: MapPoint[]): boolean {
    let inside = false
    for (
        let index = 0, previous = polygon.length - 1;
        index < polygon.length;
        previous = index++
    ) {
        const [xi, yi] = polygon[index]!
        const [xj, yj] = polygon[previous]!
        const crosses =
            yi > point[1] !== yj > point[1] &&
            point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi
        if (crosses) inside = !inside
    }
    return inside
}

function distanceToOutline(point: MapPoint, polygon: MapPoint[]): number {
    const closed = [...polygon, polygon[0]!]
    return projectOntoPolyline(closed, point)?.distance ?? 0
}

export function labelPoint(polygon: MapPoint[]): MapPoint {
    const bounds = boundsOf(polygon)
    if (!bounds) return [0, 0]
    const steps = 24
    let best: MapPoint = [
        (bounds.minX + bounds.maxX) / 2,
        (bounds.minY + bounds.maxY) / 2,
    ]
    const center = best
    let bestClearance = -1
    let bestOffset = Number.POSITIVE_INFINITY
    for (let column = 0; column <= steps; column++) {
        for (let row = 0; row <= steps; row++) {
            const candidate: MapPoint = [
                bounds.minX + ((bounds.maxX - bounds.minX) * column) / steps,
                bounds.minY + ((bounds.maxY - bounds.minY) * row) / steps,
            ]
            if (!pointInPolygon(candidate, polygon)) continue
            const clearance = roundToCm(distanceToOutline(candidate, polygon))
            const offset = distance(candidate, center)
            if (
                clearance > bestClearance ||
                (clearance === bestClearance && offset < bestOffset)
            ) {
                bestClearance = clearance
                bestOffset = offset
                best = candidate
            }
        }
    }
    return best
}

export function snapPoint(point: MapPoint, grid: number): MapPoint {
    if (grid <= 0) return [roundToCm(point[0]), roundToCm(point[1])]
    return [
        roundToCm(Math.round(point[0] / grid) * grid),
        roundToCm(Math.round(point[1] / grid) * grid),
    ]
}

export function clampPoint(point: MapPoint, map: GymMap): MapPoint {
    return [
        Math.min(map.width, Math.max(0, point[0])),
        Math.min(map.height, Math.max(0, point[1])),
    ]
}

function clampUnit(value: number) {
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
}

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value)

function toPoint(value: unknown, map: GymMap): MapPoint | null {
    if (!Array.isArray(value) || value.length !== 2) return null
    const [x, y] = value
    if (!isFiniteNumber(x) || !isFiniteNumber(y)) return null
    if (x < 0 || y < 0 || x > map.width || y > map.height) return null
    return [x, y]
}

function toPath(
    value: unknown,
    minPoints: number,
    map: GymMap,
): MapPoint[] | null {
    if (!Array.isArray(value)) return null
    if (value.length < minPoints || value.length > MAP_LIMITS.maxPoints)
        return null
    const points = value.map((point) => toPoint(point, map))
    return points.every(Boolean) ? (points as MapPoint[]) : null
}

function toTrace(value: unknown): MapTrace | null {
    if (!value || typeof value !== 'object') return null
    const { x, y, width, opacity } = value as Record<string, unknown>
    if (![x, y, width, opacity].every(isFiniteNumber)) return null
    if ((width as number) <= 0) return null
    return {
        x: x as number,
        y: y as number,
        width: width as number,
        opacity: clampUnit(opacity as number),
    }
}

export function sanitizeGymMap(value: unknown): GymMap | null {
    if (!value || typeof value !== 'object') return null
    const { width, height, shapes, trace } = value as Record<string, unknown>
    const validSize = (size: unknown) =>
        isFiniteNumber(size) &&
        size >= MAP_LIMITS.minSize &&
        size <= MAP_LIMITS.maxSize
    if (!validSize(width) || !validSize(height) || !Array.isArray(shapes))
        return null
    const map: GymMap = {
        width: width as number,
        height: height as number,
        shapes: [],
    }
    for (const shape of shapes.slice(0, MAP_LIMITS.maxShapes)) {
        const kind = (shape as MapShape | null)?.kind
        if (!kind || !MAP_SHAPE_KINDS.includes(kind)) continue
        const points = toPath(
            (shape as MapShape).points,
            MAP_LIMITS.shapeMinPoints,
            map,
        )
        if (points) map.shapes.push({ kind, points })
    }
    const traceSettings = toTrace(trace)
    if (traceSettings) map.trace = traceSettings
    return map
}

export function sanitizeWall(
    wall: { outline?: unknown; edge?: unknown; label?: unknown },
    map: GymMap,
): WallGeometry | null {
    const outline = toPath(wall.outline, MAP_LIMITS.shapeMinPoints, map)
    const edge = toPath(wall.edge, MAP_LIMITS.edgeMinPoints, map)
    if (!outline || !edge || polylineLength(edge) === 0) return null
    return { outline, edge, label: toPoint(wall.label, map) }
}

export function evenPositions(count: number): number[] {
    return Array.from({ length: count }, (_, index) =>
        roundToCm((index + 0.5) / count),
    )
}

export function compareByAnchor(
    a: { anchor_point?: number | null; name?: string },
    b: { anchor_point?: number | null; name?: string },
): number {
    const anchorA = a.anchor_point ?? Number.POSITIVE_INFINITY
    const anchorB = b.anchor_point ?? Number.POSITIVE_INFINITY
    if (anchorA !== anchorB) return anchorA - anchorB
    return (a.name ?? '').localeCompare(b.name ?? '')
}

export function autoDistribute<
    Route extends { id: string; anchor_point?: number | null; name?: string },
>(routes: Route[]): Map<string, number> {
    const ordered = [...routes].sort(compareByAnchor)
    const positions = evenPositions(ordered.length)
    return new Map(ordered.map((route, index) => [route.id, positions[index]!]))
}

export function freePosition(positions: number[]): number {
    const stops = [0, ...positions.map(clampUnit).sort((a, b) => a - b), 1]
    let best = { start: 0, size: -1 }
    for (let index = 1; index < stops.length; index++) {
        const size = stops[index]! - stops[index - 1]!
        if (size > best.size) best = { start: stops[index - 1]!, size }
    }
    return roundToCm(best.start + best.size / 2)
}
