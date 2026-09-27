<template>
    <v-container fluid class="placement-page">
        <LayoutPageHeader :title="$t('mapPlacement.title')" inline-actions>
            <template #actions>
                <v-select
                    v-if="mappedLocations.length"
                    v-model="locationId"
                    :items="locationItems"
                    :label="$t('climbing.location')"
                    density="compact"
                    hide-details
                    class="location-select"
                    data-testid="placement-location"
                />
            </template>
        </LayoutPageHeader>

        <div v-if="!map" class="placement-empty" data-testid="placement-empty">
            <LayoutEmptyState
                icon="mdi-map-outline"
                :title="$t('mapPlacement.noMap')"
            />
            <v-btn
                v-if="can('manage_settings')"
                to="/admin/map"
                variant="tonal"
                prepend-icon="mdi-floor-plan"
                class="mt-4"
            >
                {{ $t('routes.mapEditor') }}
            </v-btn>
        </div>

        <v-card v-else border flat class="placement-shell">
            <div class="placement-toolbar">
                <span
                    class="placement-hint text-body-small text-medium-emphasis"
                    aria-live="polite"
                    data-testid="placement-hint"
                >
                    {{ hint }}
                </span>
                <v-spacer />
                <v-btn
                    icon="mdi-undo"
                    variant="text"
                    :disabled="!history.length"
                    :aria-label="$t('mapEditor.undo')"
                    :title="$t('mapEditor.undo')"
                    data-testid="placement-undo"
                    @click="undo"
                />
                <v-btn
                    variant="text"
                    :disabled="!changes.length"
                    @click="discard"
                >
                    {{ $t('mapPlacement.discard') }}
                </v-btn>
                <v-btn
                    color="primary"
                    prepend-icon="mdi-content-save-outline"
                    :disabled="!changes.length"
                    :loading="saving"
                    data-testid="placement-save"
                    @click="save"
                >
                    {{ $t('mapPlacement.save', { n: changes.length }) }}
                </v-btn>
            </div>

            <div class="placement-body">
                <div class="placement-stage">
                    <MapPlacementCanvas
                        ref="canvasRef"
                        :map="map"
                        :walls="mapWalls"
                        :routes="effectiveRoutes"
                        :selected-route-id="selectedRouteId"
                        :selected-wall-id="selectedWallId"
                        :armed-route-id="armedRouteId"
                        @place="place"
                        @select-route="selectedRouteId = $event"
                        @select-wall="selectedWallId = $event"
                    />
                </div>

                <aside class="placement-side" data-testid="placement-panel">
                    <div
                        v-if="selectedWall"
                        class="placement-wall-box"
                        data-testid="placement-wall-box"
                    >
                        <p class="font-weight-semibold mb-1">
                            {{ selectedWall.name }}
                        </p>
                        <p class="text-body-small text-medium-emphasis mb-2">
                            {{
                                $t('mapPlacement.wallRoutes', {
                                    n: wallRoutes.length,
                                })
                            }}
                        </p>
                        <v-btn
                            size="small"
                            variant="tonal"
                            prepend-icon="mdi-distribute-horizontal-center"
                            :disabled="wallRoutes.length < 2"
                            data-testid="placement-distribute"
                            @click="distribute"
                        >
                            {{ $t('mapPlacement.distribute') }}
                        </v-btn>
                    </div>

                    <v-tabs
                        v-model="tab"
                        density="compact"
                        grow
                        class="flex-grow-0"
                    >
                        <v-tab
                            value="unplaced"
                            data-testid="placement-tab-unplaced"
                        >
                            {{
                                $t('mapPlacement.unplaced', {
                                    n: unplacedRoutes.length,
                                })
                            }}
                        </v-tab>
                        <v-tab
                            value="placed"
                            data-testid="placement-tab-placed"
                        >
                            {{
                                $t('mapPlacement.placed', {
                                    n: placedRoutes.length,
                                })
                            }}
                        </v-tab>
                    </v-tabs>

                    <v-text-field
                        v-model="search"
                        :label="$t('climbing.searchRouteName')"
                        prepend-inner-icon="mdi-magnify"
                        density="compact"
                        hide-details
                        clearable
                        class="ma-3 flex-grow-0"
                        data-testid="placement-search"
                    />

                    <v-list density="compact" class="placement-list" nav>
                        <v-list-item
                            v-for="item in listedRoutes"
                            :key="item.id"
                            :active="
                                item.id === armedRouteId ||
                                item.id === selectedRouteId
                            "
                            rounded="lg"
                            data-testid="placement-route"
                            :data-route-id="item.id"
                            @pointerdown="onItemPointerDown(item, $event)"
                            @click="onListClick(item.id)"
                        >
                            <template #prepend>
                                <RouteColorDot
                                    :color="item.color"
                                    :size="20"
                                    class="mr-3"
                                />
                            </template>
                            <v-list-item-title>{{
                                item.name
                            }}</v-list-item-title>
                            <v-list-item-subtitle>
                                {{ routeSubtitle(item) }}
                            </v-list-item-subtitle>
                            <template v-if="item.wall" #append>
                                <v-btn
                                    icon="mdi-map-marker-remove-outline"
                                    size="small"
                                    variant="text"
                                    :aria-label="$t('mapPlacement.remove')"
                                    :title="$t('mapPlacement.remove')"
                                    data-testid="placement-remove"
                                    @click.stop="unplace(item.id)"
                                />
                            </template>
                        </v-list-item>
                    </v-list>
                    <p
                        v-if="!listedRoutes.length"
                        class="text-body-small text-medium-emphasis pa-4"
                    >
                        {{ $t('table.no_data') }}
                    </p>
                </aside>
            </div>
        </v-card>

        <Teleport to="body">
            <div
                v-if="dragging"
                class="placement-drag-ghost"
                :style="{
                    left: `${dragging.x}px`,
                    top: `${dragging.y}px`,
                }"
                data-testid="placement-drag-ghost"
            >
                <RouteColorDot :color="dragging.color" :size="18" />
                <span>{{ dragging.name }}</span>
            </div>
        </Teleport>
    </v-container>
</template>

<script setup lang="ts">
import type { LocationRecord, RouteRecord, WallRecord } from '~/types/models'
import { autoDistribute, sanitizeGymMap } from '#shared/utils/mapGeometry'
import { formatAnchorPoint } from '#shared/utils/formatting'
import { formatGrade } from '#shared/utils/grades'
import {
    applyPlacements,
    placementChanges,
    routesOnWall,
    toMapWalls,
    type Placement,
} from '~/utils/gymMap'

definePageMeta({
    middleware: 'auth',
    requiredPermission: 'manage_routes',
})

const BATCH_SIZE = 150
const PLACEMENT_FIELDS =
    'id,name,color,grade,grade_system,anchor_point,type,wall,wall_position'

const { t } = useI18n()
const pb = usePocketbase()
const route = useRoute()
const router = useRouter()
const { can } = usePermissions()
const { success: notifySuccess, error: notifyError } = useNotification()

useSeoMeta({ title: () => t('page.title.mapPlacement') })

const { data: locations } = await useLocations()
const mappedLocations = computed(() =>
    locations.value.filter((record: LocationRecord) =>
        sanitizeGymMap(record.map),
    ),
)
const locationItems = computed(() =>
    mappedLocations.value.map((record) => ({
        title: record.name,
        value: record.id,
    })),
)
const locationId = computed({
    get: () =>
        locations.value.some((record) => record.id === route.query.location)
            ? (route.query.location as string)
            : (mappedLocations.value[0]?.id ?? ''),
    set: (id: string) => {
        if (id === locationId.value || !confirmDiscard()) return
        pending.value = new Map()
        history.value = []
        void router.replace({ query: { location: id } })
    },
})
const map = computed(() =>
    sanitizeGymMap(
        locations.value.find((record) => record.id === locationId.value)?.map,
    ),
)

const { data: walls } = await useAsyncData(
    'placement-walls',
    () =>
        locationId.value
            ? pb.collection('walls').getFullList<WallRecord>({
                  filter: pb.filter('location = {:id}', {
                      id: locationId.value,
                  }),
                  sort: 'sort,name',
                  requestKey: 'placementWalls',
              })
            : Promise.resolve([]),
    { watch: [locationId], default: () => [] },
)

const { data: routes, refresh: refreshRoutes } = await useAsyncData(
    'placement-routes',
    () =>
        locationId.value
            ? pb.collection('routes').getFullList<RouteRecord>({
                  filter: pb.filter('archived = false && location = {:id}', {
                      id: locationId.value,
                  }),
                  fields: PLACEMENT_FIELDS,
                  sort: 'anchor_point,name',
                  requestKey: 'placementRoutes',
              })
            : Promise.resolve([]),
    { watch: [locationId], default: () => [] },
)

const mapWalls = computed(() =>
    map.value ? toMapWalls(walls.value, map.value) : [],
)
const wallIds = computed(() => new Set(mapWalls.value.map((wall) => wall.id)))

const pending = ref(new Map<string, Placement>())
const history = ref<Map<string, Placement>[]>([])

const effectiveRoutes = computed(() =>
    applyPlacements(routes.value, pending.value),
)
const changes = computed(() => placementChanges(routes.value, pending.value))

const selectedRouteId = ref<string | null>(null)
const selectedWallId = ref<string | null>(null)
const armedRouteId = ref<string | null>(null)
const tab = ref<'unplaced' | 'placed'>('unplaced')
const search = ref('')

const isPlaced = (item: { wall?: string | null }) =>
    !!item.wall && wallIds.value.has(item.wall)
const unplacedRoutes = computed(() =>
    effectiveRoutes.value.filter((item) => !isPlaced(item)),
)
const placedRoutes = computed(() => effectiveRoutes.value.filter(isPlaced))
const listedRoutes = computed(() => {
    const query = (search.value ?? '').trim().toLowerCase()
    const source =
        tab.value === 'unplaced' ? unplacedRoutes.value : placedRoutes.value
    return query
        ? source.filter((item) => item.name.toLowerCase().includes(query))
        : source
})

const selectedWall = computed(() =>
    mapWalls.value.find((wall) => wall.id === selectedWallId.value),
)
const wallRoutes = computed(() =>
    selectedWallId.value
        ? routesOnWall(effectiveRoutes.value, selectedWallId.value)
        : [],
)

const hint = computed(() => {
    if (armedRouteId.value) {
        const armed = effectiveRoutes.value.find(
            (item) => item.id === armedRouteId.value,
        )
        return t('mapPlacement.hints.armed', { name: armed?.name ?? '' })
    }
    const selected = effectiveRoutes.value.find(
        (item) => item.id === selectedRouteId.value,
    )
    if (selected && isPlaced(selected))
        return t('mapPlacement.hints.selected', { name: selected.name })
    return t('mapPlacement.hints.idle')
})

function routeSubtitle(item: RouteRecord) {
    const grade = formatGrade(item)
    const anchor = formatAnchorPoint(item.anchor_point)
    return ['—', '-'].includes(String(anchor))
        ? grade
        : `${grade} · ${t('climbing.anchor_point')} ${anchor}`
}

function update(next: Map<string, Placement>) {
    history.value = [...history.value, pending.value].slice(-100)
    pending.value = next
}

function place(routeId: string, wallId: string, position: number) {
    const next = new Map(pending.value)
    next.set(routeId, { wall: wallId, position })
    update(next)
    armedRouteId.value = null
    selectedRouteId.value = routeId
}

function unplace(routeId: string) {
    const next = new Map(pending.value)
    next.set(routeId, { wall: null, position: null })
    update(next)
    if (selectedRouteId.value === routeId) selectedRouteId.value = null
}

function distribute() {
    const positions = autoDistribute(wallRoutes.value)
    const next = new Map(pending.value)
    for (const [routeId, position] of positions)
        next.set(routeId, { wall: selectedWallId.value, position })
    update(next)
}

function undo() {
    const previous = history.value.at(-1)
    if (!previous) return
    pending.value = previous
    history.value = history.value.slice(0, -1)
}

function discard() {
    if (!confirmDiscard()) return
    pending.value = new Map()
    history.value = []
}

const DRAG_THRESHOLD_PX = 6

const canvasRef = useTemplateRef<{
    previewAt: (clientX: number, clientY: number) => void
    placeAt: (routeId: string, clientX: number, clientY: number) => boolean
}>('canvasRef')
const dragging = ref<{
    id: string
    name: string
    color?: string | null
    x: number
    y: number
} | null>(null)
let suppressClick = false

function onItemPointerDown(item: RouteRecord, event: PointerEvent) {
    if (event.button !== 0 || event.pointerType === 'touch') return
    const start = { x: event.clientX, y: event.clientY }

    const move = (moveEvent: PointerEvent) => {
        const distance = Math.hypot(
            moveEvent.clientX - start.x,
            moveEvent.clientY - start.y,
        )
        if (!dragging.value && distance < DRAG_THRESHOLD_PX) return
        moveEvent.preventDefault()
        dragging.value = {
            id: item.id,
            name: item.name,
            color: item.color,
            x: moveEvent.clientX,
            y: moveEvent.clientY,
        }
        canvasRef.value?.previewAt(moveEvent.clientX, moveEvent.clientY)
    }
    const end = (endEvent: PointerEvent) => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', end)
        window.removeEventListener('pointercancel', cancel)
        if (!dragging.value) return
        suppressClick = true
        setTimeout(() => (suppressClick = false))
        canvasRef.value?.placeAt(item.id, endEvent.clientX, endEvent.clientY)
        dragging.value = null
    }
    const cancel = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', end)
        window.removeEventListener('pointercancel', cancel)
        canvasRef.value?.previewAt(-1, -1)
        dragging.value = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', cancel)
}

function onListClick(routeId: string) {
    if (suppressClick) return
    armedRouteId.value = armedRouteId.value === routeId ? null : routeId
    selectedRouteId.value = routeId
}

const saving = ref(false)

async function save() {
    if (saving.value || !changes.value.length) return
    saving.value = true
    try {
        for (let start = 0; start < changes.value.length; start += BATCH_SIZE) {
            const batch = pb.createBatch()
            for (const change of changes.value.slice(start, start + BATCH_SIZE))
                batch.collection('routes').update(change.id, {
                    wall: change.wall,
                    wall_position: change.wall_position,
                })
            await batch.send()
        }
        await refreshRoutes()
        pending.value = new Map()
        history.value = []
        notifySuccess(t('mapPlacement.saved'))
    } catch {
        notifyError(t('notifications.error.generic'))
        await refreshRoutes()
    } finally {
        saving.value = false
    }
}

function confirmDiscard() {
    return !changes.value.length || window.confirm(t('mapEditor.discard'))
}

onBeforeRouteLeave(() => confirmDiscard())

function onKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null
    if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        undo()
        event.preventDefault()
    } else if (event.key === 'Escape') {
        armedRouteId.value = null
    } else if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        selectedRouteId.value &&
        isPlaced(
            effectiveRoutes.value.find(
                (item) => item.id === selectedRouteId.value,
            ) ?? {},
        )
    ) {
        unplace(selectedRouteId.value)
        event.preventDefault()
    }
}

function onBeforeUnload(event: BeforeUnloadEvent) {
    if (changes.value.length) event.preventDefault()
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

.placement-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.placement-shell {
    display: flex;
    flex-direction: column;
    height: calc(100dvh - 200px);
    min-height: 480px;
}

.placement-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid
        rgba(var(--v-border-color), var(--v-border-opacity));
}

.placement-hint {
    flex: 1 1 280px;
}

.placement-body {
    display: grid;
    grid-template-columns: 1fr 340px;
    flex: 1;
    min-height: 0;
}

.placement-stage {
    position: relative;
    min-height: 0;
    overflow: hidden;
}

.placement-side {
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.placement-wall-box {
    padding: 12px 16px;
    border-bottom: 1px solid
        rgba(var(--v-border-color), var(--v-border-opacity));
}

.placement-list {
    flex: 1;
    overflow-y: auto;
    padding-top: 0;
}

.placement-list :deep(.v-list-item) {
    cursor: grab;
    user-select: none;
}

.placement-drag-ghost {
    position: fixed;
    z-index: 3000;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgb(var(--v-theme-surface));
    color: rgb(var(--v-theme-on-surface));
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    font-size: 0.8125rem;
    pointer-events: none;
    transform: translate(12px, 12px);
}

@media (max-width: 959.98px) {
    .placement-shell {
        height: auto;
    }

    .placement-body {
        grid-template-columns: 1fr;
    }

    .placement-stage {
        height: 60dvh;
    }

    .placement-side {
        border-left: 0;
        border-top: 1px solid
            rgba(var(--v-border-color), var(--v-border-opacity));
        max-height: 50dvh;
    }
}
</style>
