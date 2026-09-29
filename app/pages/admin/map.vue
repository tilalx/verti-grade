<template>
    <v-container fluid class="map-editor-page">
        <LayoutPageHeader :title="$t('mapEditor.title')" inline-actions>
            <template #actions>
                <v-select
                    v-model="locationId"
                    :items="locationItems"
                    :label="$t('climbing.location')"
                    density="compact"
                    hide-details
                    class="location-select"
                    data-testid="map-editor-location"
                />
            </template>
        </LayoutPageHeader>

        <LayoutDesktopHint
            v-if="!mdAndUp"
            data-testid="map-editor-small-screen"
        >
            {{ $t('mapEditor.largerScreen') }}
        </LayoutDesktopHint>

        <LayoutEmptyState
            v-else-if="!locations.length"
            :title="$t('mapEditor.noLocations')"
        />

        <v-card
            v-else-if="!hasMap"
            border
            flat
            class="setup-card"
            data-testid="map-editor-setup"
        >
            <v-card-text>
                <p class="text-title-small font-weight-semibold mb-1">
                    {{ $t('mapEditor.setupTitle') }}
                </p>
                <p class="text-body-small text-medium-emphasis mb-4">
                    {{ $t('mapEditor.setupIntro') }}
                </p>
                <form class="setup-row" @submit.prevent="createFloorPlan">
                    <v-text-field
                        v-model.number="setupWidth"
                        type="number"
                        :label="$t('mapEditor.width')"
                        suffix="m"
                        density="compact"
                        hide-details
                        :min="MAP_LIMITS.minSize"
                        :max="MAP_LIMITS.maxSize"
                        data-testid="map-editor-setup-width"
                    />
                    <v-text-field
                        v-model.number="setupHeight"
                        type="number"
                        :label="$t('mapEditor.height')"
                        suffix="m"
                        density="compact"
                        hide-details
                        :min="MAP_LIMITS.minSize"
                        :max="MAP_LIMITS.maxSize"
                        data-testid="map-editor-setup-height"
                    />
                    <v-btn
                        type="submit"
                        color="primary"
                        :disabled="!validSetupSize"
                        data-testid="map-editor-create"
                    >
                        {{ $t('mapEditor.create') }}
                    </v-btn>
                </form>
            </v-card-text>
        </v-card>

        <v-card v-else border flat class="map-workspace editor-shell">
            <div class="editor-toolbar" data-testid="map-editor-toolbar">
                <v-btn-toggle
                    :model-value="activeToolKey"
                    density="compact"
                    variant="outlined"
                    divided
                    mandatory
                >
                    <v-btn
                        v-for="option in toolOptions"
                        :key="option.key"
                        :value="option.key"
                        :prepend-icon="option.icon"
                        :data-testid="`map-editor-tool-${option.key}`"
                        @click="option.select()"
                    >
                        {{ option.label }}
                    </v-btn>
                </v-btn-toggle>

                <v-select
                    v-model="grid"
                    :items="gridItems"
                    :label="$t('mapEditor.grid')"
                    density="compact"
                    hide-details
                    class="grid-select"
                />

                <v-spacer />

                <v-btn
                    icon="mdi-undo"
                    variant="text"
                    :disabled="!editor.canUndo.value"
                    :aria-label="$t('mapEditor.undo')"
                    :title="$t('mapEditor.undo')"
                    data-testid="map-editor-undo"
                    @click="editor.undo()"
                />
                <v-btn
                    icon="mdi-redo"
                    variant="text"
                    :disabled="!editor.canRedo.value"
                    :aria-label="$t('mapEditor.redo')"
                    :title="$t('mapEditor.redo')"
                    data-testid="map-editor-redo"
                    @click="editor.redo()"
                />
                <v-btn
                    icon="mdi-fit-to-page-outline"
                    variant="text"
                    :aria-label="$t('map.fit')"
                    :title="$t('map.fit')"
                    @click="canvasRef?.fitAll(true)"
                />
                <v-btn
                    :prepend-icon="preview ? 'mdi-pencil' : 'mdi-eye-outline'"
                    variant="text"
                    data-testid="map-editor-preview"
                    @click="preview = !preview"
                >
                    {{
                        preview
                            ? $t('mapEditor.backToEditing')
                            : $t('mapEditor.preview')
                    }}
                </v-btn>
                <v-btn
                    color="primary"
                    prepend-icon="mdi-content-save-outline"
                    :disabled="!editor.isDirty.value || !!incompleteWall"
                    :loading="saving"
                    data-testid="map-editor-save"
                    @click="save"
                >
                    {{ $t('mapEditor.save') }}
                </v-btn>
            </div>

            <p
                class="editor-hint text-body-small"
                :class="
                    incompleteWall && editor.tool.value === 'select'
                        ? 'text-warning'
                        : 'text-medium-emphasis'
                "
                aria-live="polite"
                data-testid="map-editor-hint"
            >
                {{ hint }}
            </p>

            <div class="map-workspace__body">
                <div class="map-workspace__stage">
                    <MapView
                        v-if="preview"
                        :map="editor.state.value.map"
                        :walls="previewWalls"
                        :routes="previewRoutes"
                    />
                    <MapEditorCanvas
                        v-else
                        ref="canvasRef"
                        :editor="editor"
                        :grid="grid"
                        :trace-url="traceUrl"
                    />
                </div>
                <MapEditorPanel
                    class="map-workspace__side"
                    :editor="editor"
                    :has-trace="!!location?.map_trace"
                    :trace-busy="traceBusy"
                    :walls-with-routes="wallsWithRoutes"
                    @upload-trace="uploadTrace"
                    @remove-trace="removeTrace"
                />
            </div>
        </v-card>

        <ConfirmDialog
            v-model="discardDialogOpen"
            :title="$t('account.unsavedChanges')"
            :message="$t('mapEditor.discard')"
            :confirm-text="$t('mapPlacement.discard')"
            @confirm="settleDiscard(true)"
        />
    </v-container>
</template>

<script setup lang="ts">
import type {
    LocationRecord,
    RouteScoreRecord,
    WallRecord,
} from '~/types/models'
import {
    DEFAULT_MAP_HEIGHT,
    DEFAULT_MAP_WIDTH,
    MAP_LIMITS,
    sanitizeGymMap,
    sanitizeWall,
    type MapShapeKind,
} from '#shared/utils/mapGeometry'
import {
    newFloorPlan,
    wallChanges,
    wallProblems,
    type EditorState,
    type EditorWall,
} from '~/utils/mapEditor'

definePageMeta({
    middleware: ['auth'],
    requiredPermission: 'manage_settings',
})

const { t } = useI18n()
const pb = usePocketbase()
const route = useRoute()
const router = useRouter()
const { mdAndUp } = useDisplay()
const editor = useMapEditor()

useSeoMeta({ title: () => t('page.title.mapEditor') })

const { data: locations, refresh: refreshLocations } = await useLocations()
const locationId = computed({
    get: () => (route.query.location as string) || locations.value[0]?.id || '',
    set: (id: string) => {
        if (id === locationId.value) return
        void confirmDiscard().then((confirmed) => {
            if (confirmed)
                void router.replace({ query: { ...route.query, location: id } })
        })
    },
})
const location = computed(() =>
    locations.value.find((record) => record.id === locationId.value),
)
const locationItems = computed(() =>
    locations.value.map((record) => ({ title: record.name, value: record.id })),
)

const { data: wallRecords, refresh: refreshWalls } = await useAsyncData(
    'map-editor-walls',
    () =>
        locationId.value
            ? pb.collection('walls').getFullList<WallRecord>({
                  filter: pb.filter('location = {:id}', {
                      id: locationId.value,
                  }),
                  sort: 'sort,name',
                  requestKey: 'mapEditorWalls',
              })
            : Promise.resolve([]),
    { watch: [locationId], default: () => [] },
)

const { data: locationRoutes } = useAsyncData(
    'map-editor-routes',
    () =>
        locationId.value
            ? pb.collection('averageRating').getFullList<RouteScoreRecord>({
                  filter: pb.filter(
                      'archived = false && location = {:id} && wall != ""',
                      { id: locationId.value },
                  ),
                  fields: 'id,name,color,wall,wall_position,type,grade,grade_system',
                  requestKey: 'mapEditorRoutes',
              })
            : Promise.resolve([]),
    { watch: [locationId], default: () => [], server: false },
)

const savedMap = computed(() => sanitizeGymMap(location.value?.map))
const hasMap = computed(() => !!savedMap.value || editor.isDirty.value)

function toEditorState(
    record: LocationRecord | undefined,
    walls: WallRecord[],
): EditorState | null {
    const map = sanitizeGymMap(record?.map)
    if (!map) return null
    return {
        map,
        walls: walls.flatMap((wall) => {
            const geometry = sanitizeWall(wall, map)
            return [
                {
                    key: wall.id,
                    id: wall.id,
                    name: wall.name,
                    sort: wall.sort ?? 0,
                    anchorFrom: wall.anchor_from || null,
                    anchorTo: wall.anchor_to || null,
                    outline: geometry?.outline ?? [],
                    edge: geometry?.edge ?? [],
                    label: geometry?.label ?? null,
                },
            ]
        }),
    }
}

const sortedById = (state: EditorState) =>
    JSON.stringify({
        ...state,
        walls: [...state.walls].sort((a, b) => a.key.localeCompare(b.key)),
    })

let loadedLocationId = ''

watch(
    [location, wallRecords],
    () => {
        const sameLocation = loadedLocationId === locationId.value
        if (sameLocation && editor.isDirty.value) return
        loadedLocationId = locationId.value
        const next = toEditorState(location.value, wallRecords.value) ?? {
            map: {
                width: DEFAULT_MAP_WIDTH,
                height: DEFAULT_MAP_HEIGHT,
                shapes: [],
            },
            walls: [],
        }
        if (sameLocation && sortedById(next) === sortedById(editor.state.value))
            return
        editor.load(next)
    },
    { immediate: true },
)

const setupWidth = ref(DEFAULT_MAP_WIDTH)
const setupHeight = ref(DEFAULT_MAP_HEIGHT)
const validSetupSize = computed(() =>
    [setupWidth.value, setupHeight.value].every(
        (size) => size >= MAP_LIMITS.minSize && size <= MAP_LIMITS.maxSize,
    ),
)

function createFloorPlan() {
    if (!validSetupSize.value) return
    editor.commit({
        map: newFloorPlan(setupWidth.value, setupHeight.value),
        walls: [],
    })
}

const canvasRef = useTemplateRef<{
    fitAll: (animate?: boolean) => void
    finishDraft: () => void
    removeSelectedVertex: () => boolean
}>('canvasRef')
const grid = ref(0.5)
const preview = ref(false)
const gridItems = computed(() => [
    { title: t('mapEditor.gridOff'), value: 0 },
    { title: '0.25 m', value: 0.25 },
    { title: '0.5 m', value: 0.5 },
    { title: '1 m', value: 1 },
])

const drawShape = (kind: MapShapeKind) => () => {
    editor.shapeKind.value = kind
    editor.selectTool('shape')
}

const toolOptions = computed(() => [
    {
        key: 'select',
        icon: 'mdi-cursor-default-outline',
        label: t('mapEditor.tools.select'),
        select: () => editor.selectTool('select'),
    },
    {
        key: 'floor',
        icon: 'mdi-floor-plan',
        label: t('mapEditor.kinds.floor'),
        select: drawShape('floor'),
    },
    {
        key: 'mat',
        icon: 'mdi-rectangle-outline',
        label: t('mapEditor.kinds.mat'),
        select: drawShape('mat'),
    },
    {
        key: 'structure',
        icon: 'mdi-cube-outline',
        label: t('mapEditor.kinds.structure'),
        select: drawShape('structure'),
    },
])

const activeToolKey = computed(() =>
    editor.tool.value === 'shape' ? editor.shapeKind.value : 'select',
)

const incompleteWall = computed(() =>
    editor.state.value.walls.find((wall) => wallProblems(wall).length),
)

function missingText(wall: EditorWall) {
    return wallProblems(wall)
        .map((problem) => t(`mapEditor.missing.${problem}`))
        .join(', ')
}

const hint = computed(() => {
    const tool = editor.tool.value
    const name = editor.selectedWall.value?.name ?? ''
    if (tool === 'shape') return t('mapEditor.hints.polygon')
    if (tool === 'outline') return t('mapEditor.hints.outline', { name })
    if (tool === 'edge') return t('mapEditor.hints.edge', { name })
    if (tool === 'label') return t('mapEditor.hints.label')
    if (incompleteWall.value)
        return t('mapEditor.hints.incomplete', {
            name: incompleteWall.value.name,
            missing: missingText(incompleteWall.value),
        })
    if (editor.selection.value) return t('mapEditor.hints.selected')
    return t('mapEditor.hints.select')
})

const previewWalls = computed<WallRecord[]>(() =>
    editor.state.value.walls
        .filter((wall) => !wallProblems(wall).length)
        .map((wall) => ({
            id: wall.id ?? wall.key,
            location: locationId.value,
            name: wall.name,
            outline: wall.outline,
            edge: wall.edge,
            label: wall.label,
            sort: wall.sort,
            anchor_from: wall.anchorFrom,
            anchor_to: wall.anchorTo,
        })),
)
const previewRoutes = computed(() => locationRoutes.value)
const wallsWithRoutes = computed(
    () => new Set(locationRoutes.value.map((route) => route.wall ?? '')),
)

const { pending: traceBusy, run: runTrace } = useAsyncAction()
const traceUrl = computed(() =>
    location.value?.map_trace
        ? usePbFileUrl(location.value, location.value.map_trace)
        : null,
)

async function uploadTrace(file: File) {
    if (!location.value) return
    const locationRecordId = location.value.id
    await runTrace(async () => {
        await pb
            .collection('locations')
            .update(locationRecordId, { map_trace: file })
        await refreshLocations()
        const map = editor.state.value.map
        if (!map.trace)
            editor.commit({
                ...editor.state.value,
                map: {
                    ...map,
                    trace: { x: 0, y: 0, width: map.width, opacity: 0.5 },
                },
            })
    })
}

async function removeTrace() {
    if (!location.value) return
    const locationRecordId = location.value.id
    await runTrace(async () => {
        await pb
            .collection('locations')
            .update(locationRecordId, { map_trace: null })
        await refreshLocations()
        const { trace: _removed, ...map } = editor.state.value.map
        editor.commit({ ...editor.state.value, map })
    })
}

const { pending: saving, run: runSave } = useAsyncAction()

function wallPayload(wall: EditorWall) {
    return {
        location: locationId.value,
        name: wall.name.trim(),
        outline: wall.outline,
        edge: wall.edge,
        label: wall.label,
        sort: wall.sort,
        anchor_from: wall.anchorFrom,
        anchor_to: wall.anchorTo,
    }
}

async function save() {
    if (saving.value || !location.value) return
    const state = editor.state.value
    const broken = incompleteWall.value
    if (broken) {
        editor.selectTool('select')
        editor.selection.value = { kind: 'wall', key: broken.key }
        return
    }

    const changes = wallChanges(editor.saved.value.walls, state.walls)
    const batch = pb.createBatch()
    batch.collection('locations').update(location.value.id, { map: state.map })
    for (const wall of changes.create)
        batch.collection('walls').create(wallPayload(wall))
    for (const wall of changes.update)
        batch.collection('walls').update(wall.id!, wallPayload(wall))
    for (const id of changes.remove) batch.collection('walls').delete(id)

    await runSave(
        async () => {
            const results = await batch.send()
            const createdIds = results
                .slice(1, 1 + changes.create.length)
                .map((result) => (result.body as { id: string }).id)
            const idByKey = new Map(
                changes.create.map((wall, index) => [
                    wall.key,
                    createdIds[index]!,
                ]),
            )
            const next: EditorState = {
                ...state,
                walls: state.walls.map((wall) => {
                    const id = idByKey.get(wall.key)
                    return id ? { ...wall, id, key: id } : wall
                }),
            }
            const selected = editor.selection.value
            editor.markSaved(next)
            if (selected?.kind === 'wall' && idByKey.has(selected.key))
                editor.selection.value = {
                    kind: 'wall',
                    key: idByKey.get(selected.key)!,
                }
            await Promise.all([refreshLocations(), refreshWalls()])
        },
        {
            success: t('mapEditor.saved'),
            error: t('mapEditor.saveFailed'),
        },
    )
}

const { discardDialogOpen, confirmDiscard, settleDiscard } = useDiscardConfirm(
    () => editor.isDirty.value,
)

onBeforeRouteLeave(() => confirmDiscard())

function onBeforeUnload(event: BeforeUnloadEvent) {
    if (!editor.isDirty.value) return
    event.preventDefault()
}

function isTyping(target: EventTarget | null) {
    const element = target as HTMLElement | null
    return (
        !!element &&
        (element.isContentEditable ||
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName))
    )
}

function onKeyDown(event: KeyboardEvent) {
    if (isTyping(event.target) || preview.value || !hasMap.value) return
    const key = event.key.toLowerCase()
    const modifier = event.ctrlKey || event.metaKey
    if (modifier && key === 'z') {
        if (event.shiftKey) editor.redo()
        else editor.undo()
    } else if (modifier && key === 'y') editor.redo()
    else if (modifier && key === 's') void save()
    else if (key === 'enter') canvasRef.value?.finishDraft()
    else if (key === 'escape') {
        if (editor.draft.value.length || editor.tool.value !== 'select')
            editor.selectTool('select')
        else editor.selection.value = null
    } else if (key === 'delete' || key === 'backspace') {
        canvasRef.value?.removeSelectedVertex()
    } else return
    event.preventDefault()
}

onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('beforeunload', onBeforeUnload)
})
</script>

<style scoped>
.location-select {
    min-width: 200px;
}

.setup-row {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 520px;
}

.editor-shell {
    min-height: 520px;
}

.editor-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid
        rgba(var(--v-border-color), var(--v-border-opacity));
}

.grid-select {
    max-width: 130px;
}

.editor-hint {
    padding: 6px 12px;
    margin: 0;
    min-height: 30px;
}
</style>
