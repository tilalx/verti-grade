<template>
    <div class="map-view" data-testid="map-view">
        <MapCanvas
            :pan-zoom="panZoom"
            :label="$t('map.label')"
            data-testid="map-svg"
            @click="emit('selectWall', null)"
        >
            <MapFloorLayer :shapes="map.shapes" />

            <g
                v-for="wall in mapWalls"
                :key="wall.id"
                class="map-wall"
                :class="{ 'map-wall--selected': wall.id === selectedWallId }"
                role="button"
                tabindex="0"
                :aria-pressed="wall.id === selectedWallId"
                :aria-label="wallAriaLabel(wall)"
                data-testid="map-wall"
                :data-name="wall.name"
                @click.stop="emit('selectWall', wall.id)"
                @keydown.enter.prevent="emit('selectWall', wall.id)"
                @keydown.space.prevent="emit('selectWall', wall.id)"
            >
                <path :d="svgPath(wall.outline)" class="map-wall-outline" />
            </g>

            <g class="map-dots">
                <g
                    v-for="dot in dots"
                    :key="dot.routeId"
                    class="map-dot"
                    :class="{
                        'map-dot--dimmed': isDimmed(dot.routeId),
                        'map-dot--selected': dot.routeId === selectedRouteId,
                    }"
                    data-testid="map-route-dot"
                    :data-route-id="dot.routeId"
                    :data-color="dot.fill"
                    :data-sent="sentIds?.has(dot.routeId) || undefined"
                    :data-dimmed="isDimmed(dot.routeId) || undefined"
                    role="button"
                    tabindex="0"
                    :aria-pressed="dot.routeId === selectedRouteId"
                    :aria-label="dotLabel(dot.routeId)"
                    @click.stop="emit('selectRoute', dot.routeId)"
                    @keydown.enter.prevent="emit('selectRoute', dot.routeId)"
                    @keydown.space.prevent="emit('selectRoute', dot.routeId)"
                >
                    <circle
                        v-if="dot.isNew"
                        :cx="dot.point[0]"
                        :cy="dot.point[1]"
                        :r="dotRadius * 1.9"
                        :fill="dot.fill"
                        class="map-dot-halo"
                    />
                    <circle
                        :cx="dot.point[0]"
                        :cy="dot.point[1]"
                        :r="hitRadius"
                        class="map-dot-hit"
                    />
                    <circle
                        :cx="dot.point[0]"
                        :cy="dot.point[1]"
                        :r="dotRadius"
                        :fill="dot.fill"
                        :stroke="dot.stroke"
                        class="map-dot-body"
                    />
                    <path
                        v-if="sentIds?.has(dot.routeId)"
                        :d="checkPath(dot.point)"
                        :stroke="dot.stroke"
                        class="map-dot-check"
                    />
                    <circle
                        v-if="dot.routeId === selectedRouteId"
                        :cx="dot.point[0]"
                        :cy="dot.point[1]"
                        :r="dotRadius * 2.2"
                        class="map-dot-ring"
                    />
                </g>
            </g>
            <template #overlay>
                <div v-if="size.width" class="map-labels">
                    <button
                        v-for="label in labels"
                        :key="label.id"
                        type="button"
                        tabindex="-1"
                        class="wall-pill"
                        :class="{
                            'wall-pill--selected': label.id === selectedWallId,
                        }"
                        :style="{ left: `${label.x}px`, top: `${label.y}px` }"
                        data-testid="map-wall-label"
                        :data-name="label.name"
                        @click="emit('selectWall', label.id)"
                    >
                        <span class="wall-pill__name">{{ label.name }}</span>
                        <span
                            v-if="label.count"
                            class="wall-pill__count"
                            data-testid="map-wall-count"
                            >{{ label.count }}</span
                        >
                    </button>
                </div>
            </template>
        </MapCanvas>
    </div>
</template>

<script setup lang="ts">
import {
    boundsOf,
    type GymMap,
    type MapBounds,
    type MapPoint,
} from '#shared/utils/mapGeometry'
import type { WallRecord } from '~/types/models'
import {
    clearOfDots,
    placeRoutes,
    toMapWalls,
    visibleLabels,
    wallCounts,
    type MapRoute,
    type MapWall,
} from '~/utils/gymMap'
import { translatedColorName } from '~/utils/colorName'
import { mapToScreen } from '~/utils/panZoom'
import { svgPath } from '~/utils/mapSvg'

const props = withDefaults(
    defineProps<{
        map: GymMap
        walls: WallRecord[]
        routes: MapRoute[]
        layoutRoutes?: MapRoute[] | null
        sentIds?: ReadonlySet<string> | null
        matchingIds?: ReadonlySet<string> | null
        showSent?: boolean
        selectedWallId?: string | null
        selectedRouteId?: string | null
        insetBottom?: number
    }>(),
    {
        insetBottom: 0,
        layoutRoutes: null,
        sentIds: null,
        matchingIds: null,
        showSent: false,
        selectedWallId: null,
        selectedRouteId: null,
    },
)

const emit = defineEmits<{
    selectWall: [wallId: string | null]
    selectRoute: [routeId: string]
}>()

const DOT_RADIUS_PX = 5.5
const HIT_RADIUS_PX = { fine: 13, coarse: 22 }
const LABEL_HEIGHT_PX = 46
const LABEL_CHAR_PX = 8
const LABEL_PADDING_PX = 28
const LABEL_EDGE_PX = 4
const MAX_PIXELS_PER_METRE = 90
const CONTROLS_WIDTH_PX = 64
const CONTROLS_HEIGHT_PX = 160
const FOCUS_PADDING = 2
const ROUTE_FOCUS_RADIUS = 4

const { t } = useI18n()
const bounds = computed<MapBounds>(() => ({
    minX: 0,
    minY: 0,
    maxX: props.map.width,
    maxY: props.map.height,
}))

const panZoom = useSvgPanZoom({
    bounds,
    minWidth: 3,
    maxPixelsPerUnit: MAX_PIXELS_PER_METRE,
    doubleClickZoom: true,
    insetBottom: computed(() => props.insetBottom ?? 0),
})
const { viewBox, size, pixelsPerUnit, fitTo, fitAll } = panZoom
const coarsePointer = useCoarsePointer()
const hitRadiusPx = computed(() =>
    coarsePointer.value ? HIT_RADIUS_PX.coarse : HIT_RADIUS_PX.fine,
)

const mapWalls = computed(() => toMapWalls(props.walls, props.map))
const dots = computed(() => placeRoutes(mapWalls.value, props.routes))
const layoutDots = computed(() =>
    props.layoutRoutes
        ? placeRoutes(mapWalls.value, props.layoutRoutes)
        : dots.value,
)
const counts = computed(() =>
    wallCounts(props.routes, props.sentIds ?? new Set(), props.matchingIds),
)

const dotRadius = computed(() => DOT_RADIUS_PX / pixelsPerUnit.value)
const hitRadius = computed(() => hitRadiusPx.value / pixelsPerUnit.value)

function isDimmed(routeId: string) {
    return !!props.matchingIds && !props.matchingIds.has(routeId)
}

function countText(wall: MapWall) {
    const count = counts.value.get(wall.id) ?? { total: 0, sent: 0 }
    return props.showSent ? `${count.sent}/${count.total}` : `${count.total}`
}

function wallAriaLabel(wall: MapWall) {
    const count = counts.value.get(wall.id) ?? { total: 0, sent: 0 }
    return props.showSent
        ? t('map.wallSentLabel', {
              name: wall.name,
              sent: count.sent,
              total: count.total,
          })
        : t('map.wallTotalLabel', { name: wall.name, total: count.total })
}

const routesById = computed(
    () => new Map(props.routes.map((route) => [route.id, route])),
)

function dotLabel(routeId: string) {
    const route = routesById.value.get(routeId)
    return [
        route?.name,
        translatedColorName(t, route?.color),
        props.sentIds?.has(routeId) && t('ticks.sent'),
    ]
        .filter(Boolean)
        .join(', ')
}

function checkPath([x, y]: MapPoint) {
    const r = dotRadius.value
    return `M${x - r * 0.5} ${y} L${x - r * 0.1} ${y + r * 0.4} L${x + r * 0.55} ${y - r * 0.45}`
}

const labels = computed(() => {
    const screenDots = layoutDots.value.map((dot) =>
        mapToScreen(dot.point, size.value, viewBox.value),
    )
    const placed = mapWalls.value.flatMap((wall) => {
        const position = mapToScreen(wall.labelAt, size.value, viewBox.value)
        const width = wall.name.length * LABEL_CHAR_PX + LABEL_PADDING_PX
        const offScreen =
            position.x < -width / 2 ||
            position.x > size.value.width + width / 2 ||
            position.y < -LABEL_HEIGHT_PX ||
            position.y > size.value.height + LABEL_HEIGHT_PX
        if (offScreen) return []
        const box = clearOfDots(
            {
                id: wall.id,
                x: position.x,
                y: position.y,
                width,
                height: LABEL_HEIGHT_PX,
            },
            screenDots,
            hitRadiusPx.value,
            LABEL_EDGE_PX,
        )
        const y = clampInside(box.y, LABEL_HEIGHT_PX, size.value.height)
        const nearControls = y - LABEL_HEIGHT_PX / 2 < CONTROLS_HEIGHT_PX
        const x = clampInside(
            box.x,
            width,
            size.value.width - (nearControls ? CONTROLS_WIDTH_PX : 0),
        )
        return [{ ...box, name: wall.name, count: countText(wall), x, y }]
    })
    const visible = visibleLabels(placed, props.selectedWallId)
    return placed.filter((label) => visible.has(label.id))
})

function clampInside(center: number, extent: number, limit: number) {
    const margin = extent / 2 + LABEL_EDGE_PX
    if (limit < margin * 2) return limit / 2
    return Math.min(limit - margin, Math.max(margin, center))
}

function focusWall(wallId: string) {
    const wall = mapWalls.value.find((candidate) => candidate.id === wallId)
    const wallBounds = wall && boundsOf([...wall.outline, ...wall.edge])
    if (wallBounds) fitTo(wallBounds, { padding: FOCUS_PADDING })
}

function focusRoute(routeId: string) {
    const dot = dots.value.find((candidate) => candidate.routeId === routeId)
    if (!dot) return
    const [x, y] = dot.point
    fitTo({
        minX: x - ROUTE_FOCUS_RADIUS,
        minY: y - ROUTE_FOCUS_RADIUS,
        maxX: x + ROUTE_FOCUS_RADIUS,
        maxY: y + ROUTE_FOCUS_RADIUS,
    })
}

watch(
    () => [props.map.width, props.map.height],
    () => fitAll(),
)

defineExpose({ focusWall, focusRoute, fitAll })
</script>

<style scoped>
.map-view {
    position: relative;
    width: 100%;
    height: 100%;
}

.map-wall {
    cursor: pointer;
    outline: none;
}

.map-wall-outline {
    fill: color-mix(in oklab, var(--ui-text-highlighted) 20%, transparent);
    stroke: color-mix(in oklab, var(--ui-text-highlighted) 30%, transparent);
    stroke-width: 1;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    transition: fill 0.15s;
}

.map-wall:hover .map-wall-outline,
.map-wall:focus-visible .map-wall-outline {
    fill: color-mix(in oklab, var(--ui-text-highlighted) 28%, transparent);
}

.map-wall:focus-visible .map-wall-outline {
    stroke: var(--ui-primary);
    stroke-width: 2;
}

.map-wall--selected .map-wall-outline {
    fill: color-mix(in oklab, var(--ui-primary) 22%, transparent);
    stroke: var(--ui-primary);
    stroke-width: 2;
}

.map-dot {
    cursor: pointer;
    transition: opacity 0.2s;
}

.map-dot:focus {
    outline: none;
}

.map-dot:focus-visible .map-dot-hit {
    stroke: var(--ui-primary);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
}

.map-dot--dimmed {
    opacity: 0.2;
}

.map-dot-hit {
    fill: transparent;
}

.map-dot-halo {
    opacity: 0.3;
}

.map-dot-body {
    stroke-width: 1.25;
    vector-effect: non-scaling-stroke;
}

.map-dot-check {
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
}

.map-dot-ring {
    fill: none;
    stroke: var(--ui-primary);
    stroke-width: 2.5;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
    animation: dot-pulse 1.4s ease-out infinite;
    transform-box: fill-box;
    transform-origin: center;
}

@keyframes dot-pulse {
    0% {
        opacity: 1;
        transform: scale(0.7);
    }
    100% {
        opacity: 0;
        transform: scale(1.5);
    }
}

@media (prefers-reduced-motion: reduce) {
    .map-dot-ring {
        animation: none;
    }
}

.map-labels {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.wall-pill {
    position: absolute;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    pointer-events: auto;
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
    white-space: nowrap;
}

.wall-pill__name {
    padding: 4px 12px;
    border-radius: 999px;
    background: var(--ui-primary);
    color: #fff;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.3;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

.wall-pill--selected .wall-pill__name {
    outline: 3px solid color-mix(in oklab, var(--ui-primary) 35%, transparent);
}

.wall-pill__count {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--ui-text-highlighted);
    text-shadow:
        0 0 3px var(--ui-bg),
        0 0 3px var(--ui-bg);
    font-variant-numeric: tabular-nums;
}
</style>
