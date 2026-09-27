<template>
    <div class="editor-panel" data-testid="map-editor-panel">
        <section class="panel-section">
            <p class="panel-heading">{{ $t('mapEditor.walls') }}</p>
            <form class="panel-row" @submit.prevent="submitWall">
                <v-text-field
                    v-model="newWallName"
                    :label="$t('mapEditor.newWall')"
                    density="compact"
                    hide-details
                    :maxlength="100"
                    data-testid="map-editor-new-wall"
                />
                <v-btn
                    type="submit"
                    variant="tonal"
                    :disabled="!newWallName.trim()"
                    data-testid="map-editor-add-wall"
                >
                    {{ $t('mapEditor.addWall') }}
                </v-btn>
            </form>

            <v-list density="compact" class="panel-list" nav>
                <v-list-item
                    v-for="(wall, index) in sortedWalls"
                    :key="wall.key"
                    :active="wall.key === editor.selectedWall.value?.key"
                    rounded="lg"
                    data-testid="map-editor-wall-item"
                    :data-name="wall.name"
                    @click="selectWall(wall.key)"
                >
                    <v-list-item-title>{{ wall.name }}</v-list-item-title>
                    <v-list-item-subtitle
                        v-if="wallProblems(wall).length"
                        class="text-error"
                    >
                        {{ problemText(wall) }}
                    </v-list-item-subtitle>
                    <template #append>
                        <v-btn
                            icon="mdi-chevron-up"
                            size="x-small"
                            variant="text"
                            :disabled="index === 0"
                            :aria-label="$t('mapEditor.moveUp')"
                            @click.stop="commit(moveWall(state, wall.key, -1))"
                        />
                        <v-btn
                            icon="mdi-chevron-down"
                            size="x-small"
                            variant="text"
                            :disabled="index === sortedWalls.length - 1"
                            :aria-label="$t('mapEditor.moveDown')"
                            @click.stop="commit(moveWall(state, wall.key, 1))"
                        />
                    </template>
                </v-list-item>
            </v-list>

            <div
                v-if="editor.selectedWall.value"
                class="panel-details"
                data-testid="map-editor-wall-details"
            >
                <v-text-field
                    :model-value="editor.selectedWall.value.name"
                    :label="$t('mapEditor.wallName')"
                    density="compact"
                    hide-details="auto"
                    :maxlength="100"
                    data-testid="map-editor-wall-name"
                    @change="renameWall"
                />
                <div class="panel-actions">
                    <v-btn
                        size="small"
                        v-bind="stepStyle('outline')"
                        prepend-icon="mdi-vector-polygon"
                        data-testid="map-editor-draw-outline"
                        @click="editor.selectTool('outline')"
                    >
                        {{ $t('mapEditor.drawOutline') }}
                    </v-btn>
                    <v-btn
                        size="small"
                        v-bind="stepStyle('edge')"
                        prepend-icon="mdi-vector-polyline"
                        data-testid="map-editor-draw-edge"
                        @click="editor.selectTool('edge')"
                    >
                        {{ $t('mapEditor.drawEdge') }}
                    </v-btn>
                    <v-btn
                        size="small"
                        variant="tonal"
                        prepend-icon="mdi-label-outline"
                        @click="editor.selectTool('label')"
                    >
                        {{ $t('mapEditor.placeLabel') }}
                    </v-btn>
                    <v-btn
                        size="small"
                        variant="text"
                        color="error"
                        prepend-icon="mdi-delete-outline"
                        data-testid="map-editor-delete-wall"
                        @click="deleteWall"
                    >
                        {{ $t('mapEditor.deleteWall') }}
                    </v-btn>
                </div>
            </div>
        </section>

        <section class="panel-section">
            <p class="panel-heading">{{ $t('mapEditor.shapes') }}</p>
            <v-list density="compact" class="panel-list" nav>
                <v-list-item
                    v-for="(shape, index) in state.map.shapes"
                    :key="index"
                    :active="selectedShapeIndex === index"
                    :prepend-icon="SHAPE_ICONS[shape.kind]"
                    :title="`${$t(`mapEditor.kinds.${shape.kind}`)} ${index + 1}`"
                    rounded="lg"
                    data-testid="map-editor-shape-item"
                    @click="editor.selection.value = { kind: 'shape', index }"
                />
            </v-list>
            <div v-if="selectedShapeIndex !== null" class="panel-details">
                <v-select
                    :model-value="state.map.shapes[selectedShapeIndex]?.kind"
                    :items="kindItems"
                    :label="$t('mapEditor.shapeKind')"
                    density="compact"
                    hide-details
                    @update:model-value="changeKind"
                />
                <v-btn
                    size="small"
                    variant="text"
                    color="error"
                    prepend-icon="mdi-delete-outline"
                    data-testid="map-editor-delete-shape"
                    @click="deleteShape"
                >
                    {{ $t('mapEditor.deleteShape') }}
                </v-btn>
            </div>
        </section>

        <section class="panel-section">
            <p class="panel-heading">{{ $t('mapEditor.canvas') }}</p>
            <form class="panel-row" @submit.prevent="resize">
                <v-text-field
                    v-model.number="width"
                    type="number"
                    :label="$t('mapEditor.width')"
                    suffix="m"
                    density="compact"
                    hide-details
                    data-testid="map-editor-width"
                />
                <v-text-field
                    v-model.number="height"
                    type="number"
                    :label="$t('mapEditor.height')"
                    suffix="m"
                    density="compact"
                    hide-details
                    data-testid="map-editor-height"
                />
                <v-btn
                    type="submit"
                    variant="tonal"
                    :disabled="
                        width === state.map.width && height === state.map.height
                    "
                >
                    {{ $t('mapEditor.apply') }}
                </v-btn>
            </form>
            <p v-if="resizeError" class="text-body-small text-error mt-1">
                {{ $t('mapEditor.resizeTooSmall') }}
            </p>
        </section>

        <section class="panel-section">
            <p class="panel-heading">{{ $t('mapEditor.trace') }}</p>
            <p class="text-body-small text-medium-emphasis mb-2">
                {{ $t('mapEditor.traceHint') }}
            </p>
            <div class="panel-actions">
                <v-btn
                    size="small"
                    variant="tonal"
                    prepend-icon="mdi-image-plus-outline"
                    :loading="traceBusy"
                    data-testid="map-editor-trace-upload"
                    @click="traceInput?.click()"
                >
                    {{
                        hasTrace
                            ? $t('mapEditor.replaceTrace')
                            : $t('mapEditor.uploadTrace')
                    }}
                </v-btn>
                <v-btn
                    v-if="hasTrace"
                    size="small"
                    variant="text"
                    color="error"
                    prepend-icon="mdi-delete-outline"
                    :disabled="traceBusy"
                    @click="emit('removeTrace')"
                >
                    {{ $t('mapEditor.removeTrace') }}
                </v-btn>
                <input
                    ref="traceInput"
                    type="file"
                    accept="image/jpeg,image/png,image/svg+xml,image/webp"
                    hidden
                    data-testid="map-editor-trace-file"
                    @change="onTraceChosen"
                />
            </div>
            <template v-if="hasTrace && state.map.trace">
                <v-slider
                    :model-value="state.map.trace.opacity"
                    :label="$t('mapEditor.traceOpacity')"
                    :min="0.1"
                    :max="1"
                    :step="0.05"
                    density="compact"
                    hide-details
                    @update:model-value="
                        (opacity) => setTrace({ opacity: Number(opacity) })
                    "
                />
                <div class="panel-row">
                    <v-text-field
                        :model-value="state.map.trace.x"
                        type="number"
                        label="X"
                        suffix="m"
                        density="compact"
                        hide-details
                        @change="setTraceNumber('x', $event)"
                    />
                    <v-text-field
                        :model-value="state.map.trace.y"
                        type="number"
                        label="Y"
                        suffix="m"
                        density="compact"
                        hide-details
                        @change="setTraceNumber('y', $event)"
                    />
                    <v-text-field
                        :model-value="state.map.trace.width"
                        type="number"
                        :label="$t('mapEditor.width')"
                        suffix="m"
                        density="compact"
                        hide-details
                        @change="setTraceNumber('width', $event)"
                    />
                </div>
            </template>
        </section>
    </div>
</template>

<script setup lang="ts">
import {
    MAP_SHAPE_KINDS,
    type MapShapeKind,
    type MapTrace,
} from '#shared/utils/mapGeometry'
import {
    addWall,
    canResize,
    moveWall,
    removeShape,
    removeWall,
    setShapeKind,
    updateWall,
    wallProblems,
    type EditorState,
    type EditorWall,
} from '~/utils/mapEditor'

const props = defineProps<{
    editor: ReturnType<typeof useMapEditor>
    hasTrace: boolean
    traceBusy: boolean
}>()

const emit = defineEmits<{
    uploadTrace: [file: File]
    removeTrace: []
}>()

const SHAPE_ICONS: Record<MapShapeKind, string> = {
    floor: 'mdi-floor-plan',
    mat: 'mdi-rectangle-outline',
    structure: 'mdi-cube-outline',
}

const { t } = useI18n()
const editor = props.editor
const state = computed(() => editor.state.value)
const traceInput = useTemplateRef<HTMLInputElement>('traceInput')

const newWallName = ref('')
const width = ref(state.value.map.width)
const height = ref(state.value.map.height)
const resizeError = ref(false)

watch(
    () => [state.value.map.width, state.value.map.height],
    ([nextWidth, nextHeight]) => {
        width.value = nextWidth!
        height.value = nextHeight!
    },
)

const sortedWalls = computed(() =>
    [...state.value.walls].sort((a, b) => a.sort - b.sort),
)
const selectedShapeIndex = computed(() =>
    editor.selection.value?.kind === 'shape'
        ? editor.selection.value.index
        : null,
)
const kindItems = computed(() =>
    MAP_SHAPE_KINDS.map((kind) => ({
        title: t(`mapEditor.kinds.${kind}`),
        value: kind,
    })),
)

function commit(next: EditorState) {
    editor.commit(next)
}

function stepStyle(step: 'outline' | 'edge') {
    const wall = editor.selectedWall.value
    if (editor.tool.value === step)
        return { variant: 'flat' as const, color: 'primary' }
    if (wall && wallProblems(wall).includes(step))
        return { variant: 'tonal' as const, color: 'warning' }
    return { variant: 'tonal' as const }
}

function problemText(wall: EditorWall) {
    return wallProblems(wall)
        .map((problem) => t(`mapEditor.missing.${problem}`))
        .join(' · ')
}

function selectWall(key: string) {
    editor.selectTool('select')
    editor.selection.value = { kind: 'wall', key }
    editor.selectedVertex.value = null
}

function submitWall() {
    const name = newWallName.value.trim()
    if (!name) return
    const key = `new-${Date.now()}`
    commit(addWall(state.value, key, name))
    newWallName.value = ''
    selectWall(key)
    editor.selectTool('outline')
}

function renameWall(event: Event) {
    const wall = editor.selectedWall.value
    const name = (event.target as HTMLInputElement).value.trim()
    if (!wall || !name || name === wall.name) return
    commit(updateWall(state.value, wall.key, { name }))
}

function deleteWall() {
    const wall = editor.selectedWall.value
    if (!wall) return
    commit(removeWall(state.value, wall.key))
    editor.selection.value = null
}

function changeKind(kind: MapShapeKind | null) {
    if (selectedShapeIndex.value === null || !kind) return
    commit(setShapeKind(state.value, selectedShapeIndex.value, kind))
}

function deleteShape() {
    if (selectedShapeIndex.value === null) return
    commit(removeShape(state.value, selectedShapeIndex.value))
    editor.selection.value = null
}

function resize() {
    const nextWidth = Number(width.value)
    const nextHeight = Number(height.value)
    resizeError.value = !canResize(state.value, nextWidth, nextHeight)
    if (resizeError.value) return
    commit({
        ...state.value,
        map: { ...state.value.map, width: nextWidth, height: nextHeight },
    })
}

function setTrace(patch: Partial<MapTrace>) {
    const trace = state.value.map.trace
    if (!trace) return
    commit({
        ...state.value,
        map: { ...state.value.map, trace: { ...trace, ...patch } },
    })
}

function setTraceNumber(key: 'x' | 'y' | 'width', event: Event) {
    const value = Number((event.target as HTMLInputElement).value)
    if (!Number.isFinite(value) || (key === 'width' && value <= 0)) return
    setTrace({ [key]: value })
}

function onTraceChosen(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (file) emit('uploadTrace', file)
}
</script>

<style scoped>
.editor-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 16px;
    overflow-y: auto;
}

.panel-heading {
    font-weight: 600;
    margin-bottom: 8px;
}

.panel-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.panel-list {
    padding: 0;
    margin-top: 8px;
}

.panel-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
    padding: 12px;
    border-radius: 8px;
    background: rgba(var(--v-theme-on-surface), 0.04);
}

.panel-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}
</style>
