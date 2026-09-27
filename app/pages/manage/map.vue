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

        <LayoutDesktopHint class="mb-4" />

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

        <v-card v-else border flat class="map-workspace">
            <div class="placement-toolbar">
                <span
                    class="placement-hint text-body-small text-medium-emphasis"
                    aria-live="polite"
                    data-testid="placement-hint"
                >
                    {{ hint }}
                </span>
                <v-btn
                    v-if="armedRouteId"
                    variant="text"
                    prepend-icon="mdi-skip-next"
                    data-testid="placement-skip"
                    @click="skipArmed"
                >
                    {{ $t('mapPlacement.skip') }}
                </v-btn>
                <template v-if="selectedPlaced">
                    <v-btn
                        icon="mdi-chevron-left"
                        variant="tonal"
                        :aria-label="$t('mapPlacement.nudgeBack')"
                        :title="$t('mapPlacement.nudgeBack')"
                        data-testid="placement-nudge-back"
                        @click="nudge(-1)"
                    />
                    <v-btn
                        icon="mdi-chevron-right"
                        variant="tonal"
                        :aria-label="$t('mapPlacement.nudgeForward')"
                        :title="$t('mapPlacement.nudgeForward')"
                        data-testid="placement-nudge-forward"
                        @click="nudge(1)"
                    />
                </template>
                <v-spacer />
                <v-btn
                    v-if="hasAnchorRanges"
                    variant="tonal"
                    prepend-icon="mdi-auto-fix"
                    :disabled="!autoPlacements.size"
                    data-testid="placement-auto"
                    @click="autoPlace"
                >
                    {{ $t('mapPlacement.auto', { n: autoPlacements.size }) }}
                </v-btn>
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

            <div class="map-workspace__body">
                <div class="map-workspace__stage">
                    <MapPlacementCanvas
                        ref="canvasRef"
                        :map="map"
                        :walls="mapWalls"
                        :routes="effectiveRoutes"
                        :selected-route-id="selectedRouteId"
                        :selected-wall-id="selectedWallId"
                        :armed-route-id="canvasArmedId"
                        @place="place"
                        @select-route="selectedRouteId = $event"
                        @select-wall="selectedWallId = $event"
                    />
                </div>

                <aside
                    class="map-workspace__side placement-side"
                    data-testid="placement-panel"
                >
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
                        <p
                            v-if="wallAge || lastReset"
                            class="text-body-small text-medium-emphasis mb-2"
                            data-testid="placement-wall-age"
                        >
                            <template v-if="wallAge">
                                {{
                                    $t('mapPlacement.wallAge', {
                                        oldest: wallAge.oldest,
                                        average: wallAge.average,
                                    })
                                }}
                            </template>
                            <template v-if="lastReset">
                                <template v-if="wallAge">·</template>
                                {{
                                    $t('mapPlacement.lastReset', {
                                        date: formatDate(lastReset, {
                                            locale,
                                        }),
                                    })
                                }}
                            </template>
                        </p>
                        <div class="d-flex flex-wrap ga-2">
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
                            <v-btn
                                size="small"
                                variant="text"
                                color="error"
                                prepend-icon="mdi-restore-alert"
                                :disabled="
                                    !savedWallRouteIds.length ||
                                    changes.length > 0
                                "
                                :title="
                                    changes.length
                                        ? $t('mapPlacement.resetNeedsSave')
                                        : undefined
                                "
                                data-testid="placement-reset-wall"
                                @click="resetDialogOpen = true"
                            >
                                {{ $t('mapPlacement.resetWall') }}
                            </v-btn>
                        </div>
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
                        class="ma-3 mb-2 flex-grow-0"
                        data-testid="placement-search"
                    />
                    <div class="placement-filters">
                        <v-select
                            v-model="gradeFilter"
                            :items="gradeOptions"
                            :label="$t('climbing.difficulty')"
                            density="compact"
                            hide-details
                            clearable
                            data-testid="placement-grade-filter"
                        />
                        <MapColorFilter
                            v-model="colorFilter"
                            :colors="colorOptions"
                            data-testid="placement-color-filter"
                        />
                        <v-switch
                            v-model="keepGoing"
                            :label="$t('mapPlacement.keepGoing')"
                            color="primary"
                            density="compact"
                            hide-details
                            inset
                            data-testid="placement-keep-going"
                        />
                    </div>
                    <div
                        v-if="checkedIds.size"
                        class="placement-checked"
                        data-testid="placement-checked"
                    >
                        <span class="text-body-medium">
                            {{
                                $t(
                                    'mapPlacement.checked',
                                    { n: checkedIds.size },
                                    checkedIds.size,
                                )
                            }}
                        </span>
                        <v-btn
                            size="small"
                            variant="text"
                            @click="checkedIds = new Set()"
                        >
                            {{ $t('actions.cancel') }}
                        </v-btn>
                    </div>

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
                                <v-checkbox-btn
                                    v-if="tab === 'unplaced'"
                                    :model-value="checkedIds.has(item.id)"
                                    density="compact"
                                    class="mr-1"
                                    :aria-label="item.name"
                                    data-testid="placement-route-check"
                                    @click.stop
                                    @update:model-value="toggleChecked(item.id)"
                                />
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

        <ConfirmDialog
            v-model="resetDialogOpen"
            :title="$t('mapPlacement.resetWall')"
            :message="
                $t('mapPlacement.resetConfirm', {
                    n: savedWallRouteIds.length,
                    wall: selectedWall?.name ?? '',
                })
            "
            :confirm-text="$t('mapPlacement.resetWall')"
            :loading="resetting"
            data-testid="placement-reset-dialog"
            @confirm="resetWall"
        />

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
import type { LocationRecord, RouteRecord, WallRecord } from '~/types/models'
import {
    autoDistribute,
    clampUnit,
    hasAnchorRange,
    insertByAnchor,
    isDescendingRange,
    roundToCm,
    sanitizeGymMap,
    wallForAnchor,
} from '#shared/utils/mapGeometry'
import { formatAnchorPoint, formatDate } from '#shared/utils/formatting'
import { toHex6 } from '~/utils/color'
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
    'id,name,color,grade,grade_system,grade_index,anchor_point,type,wall,wall_position,screw_date'
const NUDGE_STEP = 0.02
const DAY_MS = 86_400_000

const { t, locale } = useI18n()
const pb = usePocketbase()
const route = useRoute()
const router = useRouter()
const { can } = usePermissions()
const { success: notifySuccess } = useNotification()

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
        if (id === locationId.value) return
        void confirmDiscard().then((confirmed) => {
            if (!confirmed) return
            pending.value = new Map()
            history.value = []
            void router.replace({ query: { location: id } })
        })
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
const gradeFilter = ref<string | null>(null)
const colorFilter = ref<string | null>(null)
const keepGoing = ref(true)
const checkedIds = ref(new Set<string>())

const isPlaced = (item: { wall?: string | null }) =>
    !!item.wall && wallIds.value.has(item.wall)
const unplacedRoutes = computed(() =>
    effectiveRoutes.value.filter((item) => !isPlaced(item)),
)
const placedRoutes = computed(() => effectiveRoutes.value.filter(isPlaced))
const gradeOptions = computed(() =>
    [...new Set(effectiveRoutes.value.map((item) => formatGrade(item)))].sort(
        (a, b) => a.localeCompare(b, undefined, { numeric: true }),
    ),
)
const colorOptions = computed(() => [
    ...new Set(
        effectiveRoutes.value.map((item) => toHex6(item.color)).filter(Boolean),
    ),
])

function matchesFilters(item: RouteRecord) {
    const query = (search.value ?? '').trim().toLowerCase()
    return (
        (!query || item.name.toLowerCase().includes(query)) &&
        (!gradeFilter.value || formatGrade(item) === gradeFilter.value) &&
        (!colorFilter.value || toHex6(item.color) === colorFilter.value)
    )
}

const listedUnplaced = computed(() =>
    unplacedRoutes.value.filter(matchesFilters),
)
const listedRoutes = computed(() =>
    tab.value === 'unplaced'
        ? listedUnplaced.value
        : placedRoutes.value.filter(matchesFilters),
)

const canvasArmedId = computed(
    () => armedRouteId.value ?? checkedIds.value.values().next().value ?? null,
)
const selectedPlaced = computed(() => {
    const item = effectiveRoutes.value.find(
        (candidate) => candidate.id === selectedRouteId.value,
    )
    return item && isPlaced(item) ? item : null
})

const hasAnchorRanges = computed(() => walls.value.some(hasAnchorRange))
const autoPlacements = computed(() => {
    const ranged = walls.value.filter(
        (wall) => wallIds.value.has(wall.id) && hasAnchorRange(wall),
    )
    const incomingByWall = new Map<string, RouteRecord[]>()
    for (const item of unplacedRoutes.value) {
        const wallId = wallForAnchor(ranged, item.anchor_point)
        if (wallId)
            incomingByWall.set(wallId, [
                ...(incomingByWall.get(wallId) ?? []),
                item,
            ])
    }
    const placements = new Map<string, Placement>()
    for (const [wallId, incoming] of incomingByWall)
        for (const [routeId, position] of insertByAnchor(
            routesOnWall(effectiveRoutes.value, wallId),
            incoming,
            isDescending(wallId),
        ))
            placements.set(routeId, { wall: wallId, position })
    return placements
})

const selectedWall = computed(() =>
    mapWalls.value.find((wall) => wall.id === selectedWallId.value),
)
const wallRoutes = computed(() =>
    selectedWallId.value
        ? routesOnWall(effectiveRoutes.value, selectedWallId.value)
        : [],
)

const savedWallRouteIds = computed(() =>
    selectedWallId.value
        ? routesOnWall(routes.value, selectedWallId.value).map(
              (item) => item.id,
          )
        : [],
)

const wallAge = computed(() => {
    const now = Date.now()
    const ages = wallRoutes.value
        .map((item) =>
            item.screw_date
                ? (now -
                      new Date(item.screw_date.replace(' ', 'T')).getTime()) /
                  DAY_MS
                : NaN,
        )
        .filter((age) => Number.isFinite(age) && age >= 0)
    if (!ages.length) return null
    return {
        oldest: Math.round(Math.max(...ages)),
        average: Math.round(
            ages.reduce((sum, age) => sum + age, 0) / ages.length,
        ),
    }
})

const { data: lastReset, refresh: refreshLastReset } = useAsyncData(
    'placement-wall-reset',
    () =>
        selectedWallId.value
            ? pb
                  .collection('routes')
                  .getList<RouteRecord>(1, 1, {
                      filter: pb.filter('archived = true && wall = {:wall}', {
                          wall: selectedWallId.value,
                      }),
                      sort: '-archived_at',
                      fields: 'archived_at',
                      requestKey: 'placementWallReset',
                  })
                  .then((result) => result.items[0]?.archived_at ?? null)
            : Promise.resolve(null),
    { watch: [selectedWallId], default: () => null, server: false },
)

const hint = computed(() => {
    if (checkedIds.value.size && !armedRouteId.value)
        return t(
            'mapPlacement.hints.checked',
            { n: checkedIds.value.size },
            checkedIds.value.size,
        )
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

function isDescending(wallId: string) {
    const wall = walls.value.find((record) => record.id === wallId)
    return !!wall && isDescendingRange(wall)
}

function nextUnplacedAfter(routeId: string) {
    const order = listedUnplaced.value
    const index = order.findIndex((item) => item.id === routeId)
    return index === -1 ? null : (order[index + 1]?.id ?? null)
}

function place(routeId: string, wallId: string, position: number) {
    if (checkedIds.value.has(routeId) && !armedRouteId.value) {
        placeChecked(wallId)
        return
    }
    const wasArmed = routeId === armedRouteId.value
    const following = wasArmed ? nextUnplacedAfter(routeId) : null
    const next = new Map(pending.value)
    next.set(routeId, { wall: wallId, position })
    update(next)
    if (wasArmed) armedRouteId.value = keepGoing.value ? following : null
    selectedRouteId.value = routeId
}

function placeChecked(wallId: string) {
    const incoming = effectiveRoutes.value.filter((item) =>
        checkedIds.value.has(item.id),
    )
    const placed = routesOnWall(effectiveRoutes.value, wallId).filter(
        (item) => !checkedIds.value.has(item.id),
    )
    const next = new Map(pending.value)
    for (const [routeId, position] of insertByAnchor(
        placed,
        incoming,
        isDescending(wallId),
    ))
        next.set(routeId, { wall: wallId, position })
    update(next)
    checkedIds.value = new Set()
    selectedWallId.value = wallId
}

function toggleChecked(routeId: string) {
    const next = new Set(checkedIds.value)
    if (!next.delete(routeId)) next.add(routeId)
    checkedIds.value = next
    armedRouteId.value = null
}

function autoPlace() {
    update(new Map([...pending.value, ...autoPlacements.value]))
    armedRouteId.value = null
    checkedIds.value = new Set()
}

function skipArmed() {
    if (!armedRouteId.value) return
    armedRouteId.value =
        nextUnplacedAfter(armedRouteId.value) ??
        listedUnplaced.value[0]?.id ??
        null
}

function nudge(direction: 1 | -1) {
    const item = selectedPlaced.value
    if (!item) return
    const next = new Map(pending.value)
    next.set(item.id, {
        wall: item.wall ?? null,
        position: roundToCm(
            clampUnit((item.wall_position ?? 0.5) + direction * NUDGE_STEP),
        ),
    })
    update(next)
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

async function discard() {
    if (!(await confirmDiscard())) return
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

const { pending: saving, run: runSave } = useAsyncAction()

async function save() {
    if (saving.value || !changes.value.length) return
    const saved = await runSave(
        async () => {
            for (
                let start = 0;
                start < changes.value.length;
                start += BATCH_SIZE
            ) {
                const batch = pb.createBatch()
                for (const change of changes.value.slice(
                    start,
                    start + BATCH_SIZE,
                ))
                    batch.collection('routes').update(change.id, {
                        wall: change.wall,
                        wall_position: change.wall_position,
                    })
                await batch.send()
            }
            await refreshRoutes()
            pending.value = new Map()
            history.value = []
            return true
        },
        { success: t('mapPlacement.saved') },
    )
    if (!saved) await refreshRoutes()
}

const resetDialogOpen = ref(false)
const { pending: resetting, run: runReset } = useAsyncAction()

async function resetWall() {
    const wallId = selectedWallId.value
    if (resetting.value || !wallId) return
    const archived = await runReset(async () => {
        const current = await pb.collection('routes').getFullList<RouteRecord>({
            filter: pb.filter('archived = false && wall = {:wall}', {
                wall: wallId,
            }),
            fields: 'id',
            requestKey: null,
        })
        const ids = current.map((item) => item.id)
        for (let start = 0; start < ids.length; start += BATCH_SIZE) {
            const batch = pb.createBatch()
            for (const id of ids.slice(start, start + BATCH_SIZE))
                batch.collection('routes').update(id, { archived: true })
            await batch.send()
        }
        await Promise.all([refreshRoutes(), refreshLastReset()])
        return ids.length
    })
    if (archived !== undefined)
        notifySuccess(t('mapPlacement.resetDone', { n: archived }, archived))
    resetDialogOpen.value = false
}

watch(
    routes,
    () => {
        const linked = route.query.route
        if (
            typeof linked === 'string' &&
            unplacedRoutes.value.some((item) => item.id === linked)
        ) {
            armedRouteId.value = linked
            selectedRouteId.value = linked
        }
    },
    { once: true, immediate: true },
)

const { discardDialogOpen, confirmDiscard, settleDiscard } = useDiscardConfirm(
    () => changes.value.length > 0,
)

onBeforeRouteLeave(() => confirmDiscard())

function onKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null
    if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        undo()
        event.preventDefault()
    } else if (event.key === 'Escape') {
        armedRouteId.value = null
        checkedIds.value = new Set()
    } else if (
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight') &&
        selectedPlaced.value
    ) {
        nudge(event.key === 'ArrowLeft' ? -1 : 1)
        event.preventDefault()
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

.placement-side {
    display: flex;
    flex-direction: column;
}

.placement-wall-box {
    padding: 12px 16px;
    border-bottom: 1px solid
        rgba(var(--v-border-color), var(--v-border-opacity));
}

.placement-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 0 12px 8px;
}

.placement-filters .v-select {
    flex: 1 1 140px;
}

.placement-checked {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 12px 4px 16px;
    background: rgba(var(--v-theme-primary), 0.08);
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
</style>
