<template>
    <svg
        ref="svgRef"
        class="placement-canvas"
        :class="{
            'placement-canvas--armed': !!armedRouteId,
            'placement-canvas--panning': isPanning,
        }"
        :viewBox="viewBoxAttr"
        tabindex="0"
        role="application"
        :aria-label="$t('mapPlacement.canvasLabel')"
        data-testid="placement-canvas"
        @click="onCanvasClick"
    >
        <MapFloorLayer :shapes="map.shapes" />

        <g
            v-for="wall in walls"
            :key="wall.id"
            class="placement-wall"
            :class="{ 'placement-wall--selected': wall.id === selectedWallId }"
            data-testid="placement-wall"
            :data-name="wall.name"
            @click.stop="onWallClick(wall.id, $event)"
        >
            <path :d="svgPath(wall.outline)" class="placement-wall-outline" />
            <path :d="svgPath(wall.edge, false)" class="placement-wall-edge" />
            <text
                :x="wall.labelAt[0]"
                :y="wall.labelAt[1]"
                :font-size="13 / pixelsPerUnit"
                class="placement-wall-label"
                text-anchor="middle"
                dominant-baseline="middle"
            >
                {{ wall.name }}
            </text>
        </g>

        <g
            v-for="dot in dots"
            :key="dot.routeId"
            class="placement-dot"
            :class="{
                'placement-dot--selected': dot.routeId === selectedRouteId,
                'placement-dot--dragging': dot.routeId === draggingRouteId,
            }"
            data-draggable
            data-testid="placement-dot"
            :data-route-id="dot.routeId"
            @pointerdown.stop="onDotDown(dot.routeId, $event)"
            @click.stop
        >
            <circle
                :cx="dot.point[0]"
                :cy="dot.point[1]"
                :r="hitRadius"
                class="placement-dot-hit"
            />
            <circle
                :cx="dot.point[0]"
                :cy="dot.point[1]"
                :r="dotRadius"
                :fill="dot.fill"
                :stroke="dot.stroke"
                class="placement-dot-body"
            />
            <circle
                v-if="dot.routeId === selectedRouteId"
                :cx="dot.point[0]"
                :cy="dot.point[1]"
                :r="dotRadius * 2"
                class="placement-dot-ring"
            />
        </g>

        <circle
            v-if="ghost"
            :cx="ghost.point[0]"
            :cy="ghost.point[1]"
            :r="dotRadius * 1.3"
            class="placement-ghost"
            pointer-events="none"
            data-testid="placement-ghost"
        />
    </svg>
</template>

<script setup lang="ts">
import {
    nearestWall,
    pointInPolygon,
    projectOntoPolyline,
    type EdgeProjection,
    type GymMap,
    type MapBounds,
} from '#shared/utils/mapGeometry'
import { placeRoutes, type MapRoute, type MapWall } from '~/utils/gymMap'
import { svgPath } from '~/utils/mapSvg'

const props = defineProps<{
    map: GymMap
    walls: MapWall[]
    routes: MapRoute[]
    selectedRouteId: string | null
    selectedWallId: string | null
    armedRouteId: string | null
}>()

const emit = defineEmits<{
    place: [routeId: string, wallId: string, position: number]
    selectRoute: [routeId: string | null]
    selectWall: [wallId: string | null]
}>()

const DOT_RADIUS_PX = 6
const HIT_RADIUS_PX = 12
const SNAP_RADIUS_PX = 60
const DRAG_THRESHOLD_PX = 4

const svgRef = useTemplateRef<SVGSVGElement>('svgRef')
const bounds = computed<MapBounds>(() => ({
    minX: 0,
    minY: 0,
    maxX: props.map.width,
    maxY: props.map.height,
}))
const { viewBoxAttr, pixelsPerUnit, isPanning, toMap, fitAll } = useSvgPanZoom(
    svgRef,
    {
        bounds,
        minWidth: 2,
        canStartPan: (event) =>
            !(event.target as Element).closest('[data-draggable]'),
    },
)

const dotRadius = computed(() => DOT_RADIUS_PX / pixelsPerUnit.value)
const hitRadius = computed(() => HIT_RADIUS_PX / pixelsPerUnit.value)
const draggingRouteId = ref<string | null>(null)
const ghost = ref<(EdgeProjection & { wall: MapWall }) | null>(null)

const dots = computed(() => placeRoutes(props.walls, props.routes))

function snapAt(client: { clientX: number; clientY: number }) {
    const point = toMap({ x: client.clientX, y: client.clientY })
    const containing = props.walls.find((wall) =>
        pointInPolygon(point, wall.outline),
    )
    const projection = containing && projectOntoPolyline(containing.edge, point)
    if (containing && projection) return { ...projection, wall: containing }
    return nearestWall(props.walls, point, SNAP_RADIUS_PX / pixelsPerUnit.value)
}

function isOverCanvas(clientX: number, clientY: number) {
    const bounds = svgRef.value?.getBoundingClientRect()
    return (
        !!bounds &&
        clientX >= bounds.left &&
        clientX <= bounds.right &&
        clientY >= bounds.top &&
        clientY <= bounds.bottom
    )
}

function previewAt(clientX: number, clientY: number) {
    ghost.value = isOverCanvas(clientX, clientY)
        ? snapAt({ clientX, clientY })
        : null
}

function placeAt(routeId: string, clientX: number, clientY: number) {
    ghost.value = null
    if (!isOverCanvas(clientX, clientY)) return false
    return place(routeId, { clientX, clientY })
}

defineExpose({ fitAll, previewAt, placeAt })

function place(routeId: string, client: { clientX: number; clientY: number }) {
    const target = snapAt(client)
    if (target) emit('place', routeId, target.wall.id, target.position)
    return !!target
}

function onCanvasClick(event: MouseEvent) {
    if (props.armedRouteId) {
        place(props.armedRouteId, event)
        return
    }
    emit('selectRoute', null)
    emit('selectWall', null)
}

function onWallClick(wallId: string, event: MouseEvent) {
    if (props.armedRouteId) {
        place(props.armedRouteId, event)
        return
    }
    emit('selectWall', wallId)
}

function onDotDown(routeId: string, event: PointerEvent) {
    if (event.button !== 0) return
    const target = event.currentTarget as SVGElement
    target.setPointerCapture(event.pointerId)
    const start = { x: event.clientX, y: event.clientY }
    let moved = false

    const move = (moveEvent: PointerEvent) => {
        if (
            !moved &&
            Math.hypot(
                moveEvent.clientX - start.x,
                moveEvent.clientY - start.y,
            ) < DRAG_THRESHOLD_PX
        )
            return
        moved = true
        draggingRouteId.value = routeId
        ghost.value = snapAt(moveEvent)
    }
    const end = (endEvent: PointerEvent) => {
        target.removeEventListener('pointermove', move)
        target.removeEventListener('pointerup', end)
        target.removeEventListener('pointercancel', cancel)
        if (moved) place(routeId, endEvent)
        else emit('selectRoute', routeId)
        draggingRouteId.value = null
        ghost.value = null
    }
    const cancel = () => {
        target.removeEventListener('pointermove', move)
        target.removeEventListener('pointerup', end)
        target.removeEventListener('pointercancel', cancel)
        draggingRouteId.value = null
        ghost.value = null
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', end)
    target.addEventListener('pointercancel', cancel)
}
</script>

<style scoped>
.placement-canvas {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
    user-select: none;
    outline: none;
    background: rgba(var(--v-theme-on-surface), 0.03);
    cursor: grab;
}

.placement-canvas:focus-visible {
    box-shadow: inset 0 0 0 2px rgb(var(--v-theme-primary));
}

.placement-canvas--armed {
    cursor: crosshair;
}

.placement-canvas--panning {
    cursor: grabbing;
}

.placement-wall {
    cursor: pointer;
}

.placement-wall-outline {
    fill: rgba(var(--v-theme-on-surface), 0.2);
    stroke: rgba(var(--v-theme-on-surface), 0.3);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
}

.placement-wall--selected .placement-wall-outline {
    fill: rgba(var(--v-theme-primary), 0.2);
    stroke: rgb(var(--v-theme-primary));
    stroke-width: 2;
}

.placement-wall-edge {
    fill: none;
    stroke: rgba(var(--v-theme-primary), 0.55);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 2 5;
    vector-effect: non-scaling-stroke;
}

.placement-wall-label {
    fill: rgba(var(--v-theme-on-surface), 0.75);
    font-weight: 600;
    pointer-events: none;
}

.placement-dot {
    cursor: grab;
}

.placement-dot-hit {
    fill: transparent;
}

.placement-dot-body {
    stroke-width: 1.25;
    vector-effect: non-scaling-stroke;
}

.placement-dot-ring {
    fill: none;
    stroke: rgb(var(--v-theme-primary));
    stroke-width: 2.5;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
}

.placement-dot--dragging {
    opacity: 0.4;
}

.placement-ghost {
    fill: rgba(var(--v-theme-primary), 0.35);
    stroke: rgb(var(--v-theme-primary));
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
}
</style>
