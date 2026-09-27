<template>
    <svg
        ref="svgRef"
        class="editor-canvas"
        :class="[
            `editor-canvas--${editor.tool.value}`,
            { 'editor-canvas--panning': isPanning },
        ]"
        :viewBox="viewBoxAttr"
        tabindex="0"
        role="application"
        :aria-label="$t('mapEditor.canvasLabel')"
        data-testid="map-editor-canvas"
        @click="onCanvasClick"
        @dblclick.prevent="finishDraft"
        @pointermove="onHover"
        @pointerleave="hoverPoint = null"
    >
        <defs>
            <pattern
                :id="gridId"
                :width="grid"
                :height="grid"
                patternUnits="userSpaceOnUse"
            >
                <path
                    :d="`M ${grid} 0 L 0 0 0 ${grid}`"
                    class="editor-grid-line"
                />
            </pattern>
        </defs>

        <rect
            class="editor-background"
            data-background
            :width="map.width"
            :height="map.height"
        />
        <image
            v-if="traceUrl && map.trace"
            :href="traceUrl"
            :x="map.trace.x"
            :y="map.trace.y"
            :width="map.trace.width"
            :height="map.height * 10"
            :opacity="map.trace.opacity"
            preserveAspectRatio="xMinYMin meet"
            pointer-events="none"
            data-testid="map-editor-trace"
        />
        <rect
            v-if="grid > 0"
            data-background
            :width="map.width"
            :height="map.height"
            :fill="`url(#${gridId})`"
        />

        <MapFloorLayer
            :shapes="map.shapes"
            :selected-index="selectedShapeIndex"
            @shape-pointer-down="onShapePointerDown"
            @shape-click="onShapeClick"
        />

        <g
            v-for="wall in walls"
            :key="wall.key"
            class="editor-wall"
            :class="{ 'editor-wall--selected': wall.key === selectedWallKey }"
            :data-draggable="wall.key === selectedWallKey ? '' : undefined"
            data-testid="map-editor-wall"
            :data-name="wall.name"
            @pointerdown="onWallPointerDown(wall, $event)"
            @click="onWallClick(wall, $event)"
        >
            <path
                v-if="wall.outline.length >= 3"
                :d="svgPath(wall.outline)"
                class="editor-wall-outline"
            />
            <path
                v-if="wall.edge.length >= 2"
                :d="svgPath(wall.edge, false)"
                class="editor-wall-edge"
            />
            <text
                v-if="wall.outline.length >= 3"
                :x="labelFor(wall)[0]"
                :y="labelFor(wall)[1]"
                :font-size="14 / pixelsPerUnit"
                class="editor-wall-label"
                :class="{
                    'editor-wall-label--movable': wall.key === selectedWallKey,
                }"
                :data-draggable="wall.key === selectedWallKey ? '' : undefined"
                data-testid="map-editor-wall-label"
                text-anchor="middle"
                dominant-baseline="middle"
                @pointerdown="onLabelDown(wall, $event)"
            >
                {{ wall.name }}
            </text>
        </g>

        <g v-for="handleSet in handleSets" :key="handleSet.id">
            <rect
                v-for="midpoint in handleSet.midpoints"
                :key="`mid-${midpoint.afterIndex}`"
                class="editor-midpoint"
                data-draggable
                data-testid="map-editor-midpoint"
                :x="midpoint.point[0] - handleSize / 2"
                :y="midpoint.point[1] - handleSize / 2"
                :width="handleSize"
                :height="handleSize"
                @pointerdown.stop="
                    onMidpointDown(handleSet.path, midpoint, $event)
                "
                @click.stop
            />
            <circle
                v-for="(point, index) in handleSet.points"
                :key="`vertex-${index}`"
                class="editor-vertex"
                :class="{
                    'editor-vertex--selected': isSelectedVertex(
                        handleSet.path,
                        index,
                    ),
                    'editor-vertex--edge': handleSet.path.type === 'edge',
                }"
                data-draggable
                data-testid="map-editor-vertex"
                :data-path="handleSet.path.type"
                :cx="point[0]"
                :cy="point[1]"
                :r="handleSize / 1.6"
                @pointerdown.stop="onVertexDown(handleSet.path, index, $event)"
                @click.stop
            />
        </g>

        <g v-if="isDrawing" class="editor-draft" pointer-events="none">
            <path
                v-if="draftPreview.length >= 2"
                :d="svgPath(draftPreview, false)"
                class="editor-draft-line"
            />
            <circle
                v-for="(point, index) in editor.draft.value"
                :key="index"
                :cx="point[0]"
                :cy="point[1]"
                :r="handleSize / (index === 0 ? 1.3 : 2)"
                class="editor-draft-point"
                :class="{ 'editor-draft-point--first': index === 0 }"
            />
        </g>

        <circle
            v-if="hoverPoint && (isDrawing || editor.tool.value === 'label')"
            :cx="hoverPoint[0]"
            :cy="hoverPoint[1]"
            :r="handleSize / 2.5"
            class="editor-cursor"
            pointer-events="none"
        />
    </svg>
</template>

<script setup lang="ts">
import {
    labelPoint,
    snapPoint,
    type MapBounds,
    type MapPoint,
} from '#shared/utils/mapGeometry'
import {
    addShape,
    clampToMap,
    insertVertex,
    midpoints,
    minPointsFor,
    moveVertex,
    readPath,
    snapToVertices,
    translatePoints,
    updateWall,
    withoutRepeats,
    writePath,
    type EditorPath,
    type EditorState,
    type EditorWall,
} from '~/utils/mapEditor'
import { svgPath } from '~/utils/mapSvg'

const props = defineProps<{
    editor: ReturnType<typeof useMapEditor>
    grid: number
    traceUrl?: string | null
}>()

const HANDLE_PX = 12
const SNAP_PX = 10

const gridId = useId()
const svgRef = useTemplateRef<SVGSVGElement>('svgRef')
const editor = props.editor
const map = computed(() => editor.state.value.map)
const walls = computed(() =>
    [...editor.state.value.walls].sort((a, b) => a.sort - b.sort),
)
const bounds = computed<MapBounds>(() => ({
    minX: 0,
    minY: 0,
    maxX: map.value.width,
    maxY: map.value.height,
}))

const { viewBoxAttr, pixelsPerUnit, isPanning, toMap, fitAll, zoomBy } =
    useSvgPanZoom(svgRef, {
        bounds,
        minWidth: 1,
        canStartPan: (event) =>
            !(event.target as Element).closest('[data-draggable]'),
    })

const hoverPoint = ref<MapPoint | null>(null)
const handleSize = computed(() => HANDLE_PX / pixelsPerUnit.value)
const isDrawing = computed(() =>
    ['shape', 'outline', 'edge'].includes(editor.tool.value),
)
const selectedShapeIndex = computed(() =>
    editor.selection.value?.kind === 'shape'
        ? editor.selection.value.index
        : null,
)
const selectedWallKey = computed(() =>
    editor.selection.value?.kind === 'wall' ? editor.selection.value.key : null,
)

const draftPreview = computed(() =>
    hoverPoint.value
        ? [...editor.draft.value, hoverPoint.value]
        : editor.draft.value,
)

const handleSets = computed(() => {
    if (editor.tool.value !== 'select') return []
    const selection = editor.selection.value
    const paths: EditorPath[] =
        selection?.kind === 'shape'
            ? [{ type: 'shape', index: selection.index }]
            : selection?.kind === 'wall'
              ? [
                    { type: 'outline', key: selection.key },
                    { type: 'edge', key: selection.key },
                ]
              : []
    return paths.map((path) => {
        const points = readPath(editor.state.value, path)
        return {
            id: JSON.stringify(path),
            path,
            points,
            midpoints: midpoints(points, path.type !== 'edge'),
        }
    })
})

function labelFor(wall: EditorWall): MapPoint {
    return wall.label ?? labelPoint(wall.outline)
}

function isSelectedVertex(path: EditorPath, index: number) {
    const selected = editor.selectedVertex.value
    return (
        !!selected &&
        selected.index === index &&
        JSON.stringify(selected.path) === JSON.stringify(path)
    )
}

function allVertices(except?: { path: EditorPath; index: number }) {
    const state = editor.state.value
    const exceptKey = except ? JSON.stringify(except.path) : ''
    const paths: EditorPath[] = [
        ...state.map.shapes.map((_, index) => ({
            type: 'shape' as const,
            index,
        })),
        ...state.walls.flatMap((wall) => [
            { type: 'outline' as const, key: wall.key },
            { type: 'edge' as const, key: wall.key },
        ]),
    ]
    return paths.flatMap((path) =>
        readPath(state, path).filter(
            (_, index) =>
                JSON.stringify(path) !== exceptKey || index !== except!.index,
        ),
    )
}

function snapped(
    client: { clientX: number; clientY: number },
    except?: { path: EditorPath; index: number },
): MapPoint {
    const raw = toMap({ x: client.clientX, y: client.clientY })
    const vertex = snapToVertices(
        raw,
        allVertices(except),
        SNAP_PX / pixelsPerUnit.value,
    )
    return clampToMap(vertex ?? snapPoint(raw, props.grid), map.value)
}

function onHover(event: PointerEvent) {
    if (!isDrawing.value && editor.tool.value !== 'label') return
    hoverPoint.value = snapped(event)
}

function trackDrag(event: PointerEvent, onMove: (move: PointerEvent) => void) {
    const target = event.currentTarget as SVGElement
    target.setPointerCapture(event.pointerId)
    editor.beginGesture()
    const move = (moveEvent: PointerEvent) => onMove(moveEvent)
    const end = () => {
        target.removeEventListener('pointermove', move)
        target.removeEventListener('pointerup', end)
        target.removeEventListener('pointercancel', end)
        editor.endGesture()
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', end)
    target.addEventListener('pointercancel', end)
}

function onVertexDown(path: EditorPath, index: number, event: PointerEvent) {
    if (event.button !== 0) return
    editor.selectedVertex.value = { path, index }
    trackDrag(event, (move) => {
        const point = snapped(move, { path, index })
        const state = editor.state.value
        editor.preview(
            writePath(
                state,
                path,
                moveVertex(readPath(state, path), index, point),
            ),
        )
    })
}

function onMidpointDown(
    path: EditorPath,
    midpoint: { afterIndex: number; point: MapPoint },
    event: PointerEvent,
) {
    if (event.button !== 0) return
    const state = editor.state.value
    editor.commit(
        writePath(
            state,
            path,
            insertVertex(
                readPath(state, path),
                midpoint.afterIndex,
                midpoint.point,
            ),
        ),
    )
    onVertexDown(path, midpoint.afterIndex + 1, event)
}

function dragSelection(
    event: PointerEvent,
    apply: (start: EditorState, dx: number, dy: number) => EditorState,
) {
    if (event.button !== 0 || editor.tool.value !== 'select') return
    event.stopPropagation()
    const start = editor.state.value
    const origin = toMap({ x: event.clientX, y: event.clientY })
    trackDrag(event, (move) => {
        const point = toMap({ x: move.clientX, y: move.clientY })
        const dx = snapPoint([point[0] - origin[0], 0], props.grid)[0]
        const dy = snapPoint([0, point[1] - origin[1]], props.grid)[1]
        editor.preview(apply(start, dx, dy))
    })
}

function onShapePointerDown(index: number, event: PointerEvent) {
    if (selectedShapeIndex.value !== index) return
    dragSelection(event, (start, dx, dy) =>
        writePath(
            start,
            { type: 'shape', index },
            translatePoints(start.map.shapes[index]!.points, dx, dy, start.map),
        ),
    )
}

function onShapeClick(index: number, event: MouseEvent) {
    if (editor.tool.value !== 'select') return
    event.stopPropagation()
    editor.selection.value = { kind: 'shape', index }
    editor.selectedVertex.value = null
}

function onWallPointerDown(wall: EditorWall, event: PointerEvent) {
    if (selectedWallKey.value !== wall.key) return
    dragSelection(event, (start, dx, dy) => {
        const original = start.walls.find((item) => item.key === wall.key)!
        const all = [
            ...original.outline,
            ...original.edge,
            ...(original.label ? [original.label] : []),
        ]
        const moved = translatePoints(all, dx, dy, start.map)
        const [safeDx, safeDy] = all.length
            ? [moved[0]![0] - all[0]![0], moved[0]![1] - all[0]![1]]
            : [0, 0]
        const shift = (points: MapPoint[]) =>
            translatePoints(points, safeDx, safeDy, start.map)
        return updateWall(start, wall.key, {
            outline: shift(original.outline),
            edge: shift(original.edge),
            label: original.label ? shift([original.label])[0]! : null,
        })
    })
}

function onLabelDown(wall: EditorWall, event: PointerEvent) {
    if (
        event.button !== 0 ||
        editor.tool.value !== 'select' ||
        selectedWallKey.value !== wall.key
    )
        return
    event.stopPropagation()
    trackDrag(event, (move) => {
        editor.preview(
            updateWall(editor.state.value, wall.key, {
                label: snapped(move),
            }),
        )
    })
}

function onWallClick(wall: EditorWall, event: MouseEvent) {
    if (editor.tool.value !== 'select') return
    event.stopPropagation()
    editor.selection.value = { kind: 'wall', key: wall.key }
    editor.selectedVertex.value = null
}

function closesPolygon(point: MapPoint) {
    const [first] = editor.draft.value
    if (!first || editor.draft.value.length < 3) return false
    const gap = Math.hypot(point[0] - first[0], point[1] - first[1])
    return gap <= SNAP_PX / pixelsPerUnit.value
}

function onCanvasClick(event: MouseEvent) {
    const tool = editor.tool.value
    if (tool === 'select') {
        if ((event.target as Element).hasAttribute('data-background')) {
            editor.selection.value = null
            editor.selectedVertex.value = null
        }
        return
    }
    const point = snapped(event)
    if (tool === 'label') {
        const wall = editor.selectedWall.value
        if (wall)
            editor.commit(
                updateWall(editor.state.value, wall.key, { label: point }),
            )
        editor.selectTool('select')
        return
    }
    if (tool !== 'edge' && closesPolygon(point)) {
        finishDraft()
        return
    }
    editor.draft.value = [...editor.draft.value, point]
}

function finishDraft() {
    const tool = editor.tool.value
    if (!isDrawing.value) return
    const points = withoutRepeats(editor.draft.value)
    const state = editor.state.value
    const wall = editor.selectedWall.value
    const minPoints = tool === 'edge' ? 2 : 3
    if (points.length < minPoints) return

    if (tool === 'shape') {
        const next = addShape(state, editor.shapeKind.value, points)
        editor.commit(next)
        editor.selection.value = {
            kind: 'shape',
            index: next.map.shapes.length - 1,
        }
        editor.selectTool('select')
    } else if (wall && tool === 'outline') {
        editor.commit(updateWall(state, wall.key, { outline: points }))
        editor.selectTool(wall.edge.length ? 'select' : 'edge')
    } else if (wall && tool === 'edge') {
        editor.commit(updateWall(state, wall.key, { edge: points }))
        editor.selectTool('select')
    }
}

function removeSelectedVertex() {
    const selected = editor.selectedVertex.value
    if (!selected) return false
    const state = editor.state.value
    const points = readPath(state, selected.path)
    const remaining =
        points.length > minPointsFor(selected.path)
            ? points.filter((_, index) => index !== selected.index)
            : null
    if (!remaining) return false
    editor.commit(writePath(state, selected.path, remaining))
    editor.selectedVertex.value = null
    return true
}

defineExpose({ fitAll, zoomBy, finishDraft, removeSelectedVertex })
</script>

<style scoped>
.editor-canvas {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
    user-select: none;
    background: rgba(var(--v-theme-on-surface), 0.03);
    outline: none;
}

.editor-canvas:focus-visible {
    box-shadow: inset 0 0 0 2px rgb(var(--v-theme-primary));
}

.editor-canvas--shape,
.editor-canvas--outline,
.editor-canvas--edge,
.editor-canvas--label {
    cursor: crosshair;
}

.editor-canvas--panning {
    cursor: grabbing;
}

.editor-background {
    fill: rgb(var(--v-theme-surface));
}

.editor-grid-line {
    fill: none;
    stroke: rgba(var(--v-theme-on-surface), 0.08);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
}

.editor-wall-outline {
    fill: rgba(var(--v-theme-on-surface), 0.3);
    stroke: rgba(var(--v-theme-on-surface), 0.45);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
}

.editor-wall--selected .editor-wall-outline {
    fill: rgba(var(--v-theme-primary), 0.28);
    stroke: rgb(var(--v-theme-primary));
    stroke-width: 2;
}

.editor-wall--selected {
    cursor: move;
}

.editor-wall-edge {
    fill: none;
    stroke: rgb(var(--v-theme-primary));
    stroke-width: 4;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
}

.editor-wall-label {
    fill: rgb(var(--v-theme-on-surface));
    font-weight: 600;
}

.editor-wall-label--movable {
    cursor: move;
    text-decoration: underline dotted;
}

.editor-vertex {
    fill: rgb(var(--v-theme-surface));
    stroke: rgb(var(--v-theme-primary));
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    cursor: grab;
}

.editor-vertex--edge {
    fill: rgb(var(--v-theme-primary));
}

.editor-vertex--selected {
    fill: rgb(var(--v-theme-error));
    stroke: rgb(var(--v-theme-error));
}

.editor-midpoint {
    fill: rgba(var(--v-theme-primary), 0.5);
    cursor: copy;
}

.editor-draft-line {
    fill: none;
    stroke: rgb(var(--v-theme-primary));
    stroke-width: 2;
    stroke-dasharray: 6 4;
    vector-effect: non-scaling-stroke;
}

.editor-draft-point {
    fill: rgb(var(--v-theme-primary));
}

.editor-draft-point--first {
    fill: rgb(var(--v-theme-surface));
    stroke: rgb(var(--v-theme-primary));
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
}

.editor-cursor {
    fill: rgba(var(--v-theme-primary), 0.6);
}
</style>
