import type { Ref } from 'vue'
import {
    fitViewBox,
    type MapBounds,
    type MapPoint,
    type ViewBox,
} from '#shared/utils/mapGeometry'
import {
    clampToBounds,
    interpolateView,
    panBy,
    screenToMap,
    withAspect,
    zoomAt,
} from '~/utils/panZoom'

interface PanZoomOptions {
    bounds: Ref<MapBounds>
    minWidth?: number
    maxPixelsPerUnit?: number
    canStartPan?: (event: PointerEvent) => boolean
    doubleClickZoom?: boolean
}

const DRAG_THRESHOLD_PX = 6
const WHEEL_ZOOM_SPEED = 0.001
const KEY_PAN_FRACTION = 0.1
const ANIMATION_MS = 280
const INITIAL_ASPECT_RATIO = 3 / 4
const UNMEASURED_WIDTH_PX = 800

export function useSvgPanZoom(
    svgRef: Ref<SVGSVGElement | null>,
    options: PanZoomOptions,
) {
    const viewBox = ref<ViewBox>(
        fitViewBox(options.bounds.value, INITIAL_ASPECT_RATIO, 0.5),
    )
    const size = ref({ width: 0, height: 0 })
    const isPanning = ref(false)

    const pixelsPerUnit = computed(
        () =>
            (size.value.width || UNMEASURED_WIDTH_PX) /
            Math.max(viewBox.value.width, 0.01),
    )
    const viewBoxAttr = computed(() => {
        const { x, y, width, height } = viewBox.value
        return `${x} ${y} ${width} ${height}`
    })

    const limits = computed(() => {
        const bounds = options.bounds.value
        const width = bounds.maxX - bounds.minX
        const height = bounds.maxY - bounds.minY
        return {
            minWidth: Math.max(
                options.minWidth ?? 2,
                options.maxPixelsPerUnit
                    ? size.value.width / options.maxPixelsPerUnit
                    : 0,
            ),
            maxWidth: Math.max(width, height * aspectRatio(), 1) * 1.5,
        }
    })

    const pointers = new Map<number, { x: number; y: number }>()
    let dragStartDistance = 0
    let dragged = false
    let pinchDistance = 0
    let animationFrame = 0
    let pendingFit: { bounds: MapBounds; padding: number } | null = null
    let lastFit: { bounds: MapBounds; padding: number } | null = null
    let userMoved = false

    const aspectRatio = () =>
        size.value.height > 0 ? size.value.width / size.value.height : 1

    function rect() {
        return svgRef.value!.getBoundingClientRect()
    }

    function setView(next: ViewBox) {
        viewBox.value = clampToBounds(next, options.bounds.value)
    }

    function toMap(client: { x: number; y: number }): MapPoint {
        return screenToMap(client, rect(), viewBox.value)
    }

    function stopAnimation() {
        if (animationFrame) cancelAnimationFrame(animationFrame)
        animationFrame = 0
    }

    function animateTo(target: ViewBox) {
        stopAnimation()
        const from = viewBox.value
        const reduceMotion = window.matchMedia?.(
            '(prefers-reduced-motion: reduce)',
        ).matches
        if (reduceMotion) {
            setView(target)
            return
        }
        const start = performance.now()
        const step = (now: number) => {
            const progress = Math.min(1, (now - start) / ANIMATION_MS)
            viewBox.value = interpolateView(from, target, progress)
            animationFrame = progress < 1 ? requestAnimationFrame(step) : 0
        }
        animationFrame = requestAnimationFrame(step)
    }

    function fitTo(bounds: MapBounds, { padding = 1, animate = true } = {}) {
        if (!size.value.width) {
            pendingFit = { bounds, padding }
            return
        }
        lastFit = { bounds, padding }
        userMoved = false
        const target = fitViewBox(bounds, aspectRatio(), padding)
        if (animate) animateTo(target)
        else viewBox.value = target
    }

    function fitAll(animate = false) {
        fitTo(options.bounds.value, { padding: 0.5, animate })
    }

    function zoomBy(factor: number, focus?: MapPoint) {
        stopAnimation()
        userMoved = true
        const view = viewBox.value
        const center: MapPoint = focus ?? [
            view.x + view.width / 2,
            view.y + view.height / 2,
        ]
        setView(zoomAt(view, center, factor, limits.value))
    }

    function onPointerDown(event: PointerEvent) {
        if (options.canStartPan && !options.canStartPan(event)) return
        stopAnimation()
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
        dragStartDistance = 0
        dragged = false
        if (pointers.size === 2) {
            const [a, b] = [...pointers.values()]
            pinchDistance = Math.hypot(a!.x - b!.x, a!.y - b!.y)
        }
    }

    function onPointerMove(event: PointerEvent) {
        const previous = pointers.get(event.pointerId)
        if (!previous) return
        const current = { x: event.clientX, y: event.clientY }

        if (pointers.size === 1) {
            dragStartDistance += Math.hypot(
                current.x - previous.x,
                current.y - previous.y,
            )
            if (!dragged && dragStartDistance < DRAG_THRESHOLD_PX) return
            if (!dragged) {
                dragged = true
                userMoved = true
                isPanning.value = true
                svgRef.value?.setPointerCapture(event.pointerId)
            }
            const scale = pixelsPerUnit.value
            setView(
                panBy(
                    viewBox.value,
                    (previous.x - current.x) / scale,
                    (previous.y - current.y) / scale,
                ),
            )
        } else if (pointers.size === 2) {
            dragged = true
            userMoved = true
            const other = [...pointers.entries()].find(
                ([id]) => id !== event.pointerId,
            )![1]
            const distance = Math.hypot(
                current.x - other.x,
                current.y - other.y,
            )
            const focus = toMap({
                x: (current.x + other.x) / 2,
                y: (current.y + other.y) / 2,
            })
            if (pinchDistance > 0)
                setView(
                    zoomAt(
                        viewBox.value,
                        focus,
                        distance / pinchDistance,
                        limits.value,
                    ),
                )
            pinchDistance = distance
        }
        pointers.set(event.pointerId, current)
    }

    function onPointerUp(event: PointerEvent) {
        pointers.delete(event.pointerId)
        if (pointers.size < 2) pinchDistance = 0
        if (!pointers.size) isPanning.value = false
    }

    function onClickCapture(event: MouseEvent) {
        if (!dragged) return
        dragged = false
        event.stopImmediatePropagation()
        event.preventDefault()
    }

    function onWheel(event: WheelEvent) {
        event.preventDefault()
        zoomBy(
            Math.exp(-event.deltaY * WHEEL_ZOOM_SPEED),
            toMap({ x: event.clientX, y: event.clientY }),
        )
    }

    function onDoubleClick(event: MouseEvent) {
        if (!options.doubleClickZoom) return
        zoomBy(2, toMap({ x: event.clientX, y: event.clientY }))
    }

    function onKeyDown(event: KeyboardEvent) {
        const view = viewBox.value
        const step = view.width * KEY_PAN_FRACTION
        const moves: Record<string, [number, number]> = {
            ArrowLeft: [-step, 0],
            ArrowRight: [step, 0],
            ArrowUp: [0, -step],
            ArrowDown: [0, step],
        }
        if (event.target !== svgRef.value) return
        if (event.key === '+' || event.key === '=') zoomBy(1.4)
        else if (event.key === '-') zoomBy(1 / 1.4)
        else if (moves[event.key]) {
            const [dx, dy] = moves[event.key]!
            userMoved = true
            setView(panBy(view, dx, dy))
        } else return
        event.preventDefault()
    }

    let resizeObserver: ResizeObserver | null = null

    onMounted(() => {
        const svg = svgRef.value
        if (!svg) return
        svg.addEventListener('pointerdown', onPointerDown)
        svg.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', onPointerUp)
        window.addEventListener('pointercancel', onPointerUp)
        svg.addEventListener('click', onClickCapture, true)
        svg.addEventListener('wheel', onWheel, { passive: false })
        svg.addEventListener('dblclick', onDoubleClick)
        svg.addEventListener('keydown', onKeyDown)

        resizeObserver = new ResizeObserver(([entry]) => {
            if (!entry) return
            const hadSize = size.value.width > 0
            size.value = {
                width: entry.contentRect.width,
                height: entry.contentRect.height,
            }
            if (!size.value.width || !size.value.height) return
            if (hadSize && (userMoved || !lastFit)) {
                viewBox.value = withAspect(viewBox.value, aspectRatio())
                return
            }
            if (hadSize && lastFit) {
                viewBox.value = fitViewBox(
                    lastFit.bounds,
                    aspectRatio(),
                    lastFit.padding,
                )
                return
            }
            const initial = pendingFit ?? {
                bounds: options.bounds.value,
                padding: 0.5,
            }
            pendingFit = null
            fitTo(initial.bounds, { padding: initial.padding, animate: false })
        })
        resizeObserver.observe(svg)
    })

    onBeforeUnmount(() => {
        stopAnimation()
        resizeObserver?.disconnect()
        window.removeEventListener('pointerup', onPointerUp)
        window.removeEventListener('pointercancel', onPointerUp)
        const svg = svgRef.value
        if (!svg) return
        svg.removeEventListener('pointerdown', onPointerDown)
        svg.removeEventListener('pointermove', onPointerMove)
        svg.removeEventListener('click', onClickCapture, true)
        svg.removeEventListener('wheel', onWheel)
        svg.removeEventListener('dblclick', onDoubleClick)
        svg.removeEventListener('keydown', onKeyDown)
    })

    return {
        viewBox,
        viewBoxAttr,
        size,
        pixelsPerUnit,
        isPanning,
        toMap,
        zoomBy,
        fitTo,
        fitAll,
    }
}
