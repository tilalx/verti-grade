<template>
    <div class="map-page" data-testid="map-page">
        <h1 class="d-sr-only">{{ $t('map.title') }}</h1>

        <div class="map-header">
            <v-select
                v-if="mappedLocations.length > 1"
                v-model="locationId"
                :items="locationItems"
                :label="$t('climbing.location')"
                density="compact"
                hide-details
                class="map-location"
                data-testid="map-location"
            />
            <span v-else-if="location" class="map-title">{{
                location.name
            }}</span>
            <v-spacer />
            <v-btn-toggle
                v-model="mapType"
                density="compact"
                variant="outlined"
                divided
                mandatory
                data-testid="map-type"
            >
                <v-btn
                    v-for="option in typeOptions"
                    :key="option.value"
                    :value="option.value"
                    size="small"
                    :data-testid="`map-type-${option.value || 'all'}`"
                >
                    {{ option.label }}
                </v-btn>
            </v-btn-toggle>
        </div>

        <div class="map-body">
            <div class="map-stage">
                <MapView
                    v-if="map"
                    ref="mapViewRef"
                    :map="map"
                    :walls="walls"
                    :routes="routes"
                    :layout-routes="allRoutes"
                    :sent-ids="isLoggedIn ? tickedRouteIds : null"
                    :matching-ids="matchingIds"
                    :show-sent="isLoggedIn"
                    :selected-wall-id="selectedWallId"
                    :selected-route-id="selectedRouteId"
                    @select-wall="selectWall"
                    @select-route="selectRoute"
                />
                <div v-else class="map-empty" data-testid="map-empty">
                    <LayoutEmptyState
                        icon="mdi-map-outline"
                        :card="false"
                        :title="$t('map.noMap')"
                    />
                    <v-btn
                        to="/"
                        variant="tonal"
                        prepend-icon="mdi-format-list-bulleted"
                    >
                        {{ $t('map.openList') }}
                    </v-btn>
                </div>

                <v-btn
                    v-if="map"
                    class="map-filter-fab"
                    icon
                    size="large"
                    variant="elevated"
                    :aria-label="$t('map.filters')"
                    data-testid="map-filter-open"
                    @click="filtersOpen = true"
                >
                    <v-badge
                        :model-value="activeCount > 0"
                        :content="activeCount"
                        color="primary"
                    >
                        <v-icon>mdi-filter-variant</v-icon>
                    </v-badge>
                </v-btn>

                <v-card
                    v-if="selectedRoute"
                    class="map-route-card"
                    elevation="6"
                    data-testid="map-route-card"
                >
                    <RouteCard
                        :route="selectedRoute"
                        :ticked="tickedRouteIds.has(selectedRoute.id)"
                    >
                        <template #actions>
                            <v-btn
                                icon="mdi-close"
                                variant="text"
                                size="small"
                                :aria-label="$t('map.close')"
                                :title="$t('map.close')"
                                data-testid="map-route-card-close"
                                @click="selectRoute(null)"
                            />
                            <v-btn
                                v-if="isLoggedIn"
                                variant="tonal"
                                prepend-icon="mdi-check-circle-outline"
                                data-testid="map-log-ascent"
                                @click="openTick(selectedRoute.id)"
                            >
                                {{ $t('ticks.logAscent') }}
                            </v-btn>
                            <RouteViewButton
                                :route-id="selectedRoute.id"
                                compact
                            />
                        </template>
                    </RouteCard>
                </v-card>
            </div>

            <aside
                v-if="map && mdAndUp"
                class="map-side"
                data-testid="map-list"
            >
                <div class="map-side__header">
                    <span
                        class="text-truncate font-weight-semibold"
                        data-testid="map-list-title"
                        >{{ listTitle }} · {{ listCount }}</span
                    >
                    <v-spacer />
                    <v-btn
                        v-if="selectedWallId"
                        variant="text"
                        size="small"
                        data-testid="map-list-all"
                        @click="selectWall(null)"
                    >
                        {{ $t('map.allWalls') }}
                    </v-btn>
                </div>
                <MapRouteList
                    class="map-side__list"
                    :groups="listGroups"
                    :show-headings="!selectedWallId"
                    :ticked-ids="tickedRouteIds"
                    :selected-route-id="selectedRouteId"
                    @select="onListSelect"
                />
            </aside>
        </div>

        <button
            v-if="map && !mdAndUp"
            type="button"
            class="map-list-bar"
            data-testid="map-show-list"
            :aria-expanded="listOpen"
            @click="listOpen = true"
        >
            <v-icon size="18">mdi-chevron-up</v-icon>
            {{ listBarText }}
        </button>

        <v-bottom-sheet v-if="!mdAndUp" v-model="listOpen" scrollable>
            <v-card data-testid="map-list">
                <v-card-title class="d-flex align-center ga-2">
                    <span class="text-truncate">{{ listTitle }}</span>
                    <v-spacer />
                    <v-btn
                        v-if="selectedWallId"
                        variant="text"
                        size="small"
                        data-testid="map-list-all"
                        @click="selectWall(null)"
                    >
                        {{ $t('map.allWalls') }}
                    </v-btn>
                    <v-btn
                        icon="mdi-close"
                        variant="text"
                        :aria-label="$t('map.close')"
                        @click="listOpen = false"
                    />
                </v-card-title>
                <v-card-text class="px-2">
                    <MapRouteList
                        :groups="listGroups"
                        :show-headings="!selectedWallId"
                        :ticked-ids="tickedRouteIds"
                        :selected-route-id="selectedRouteId"
                        @select="onListSelect"
                    />
                </v-card-text>
            </v-card>
        </v-bottom-sheet>

        <LayoutDialogShell
            v-model="filtersOpen"
            max-width="480"
            closable
            sheet-on-mobile
            :title="$t('map.filters')"
            data-testid="map-filter-dialog"
        >
            <div class="d-flex flex-column ga-4">
                <v-text-field
                    v-model="searchRouteName"
                    :label="$t('climbing.searchRouteName')"
                    prepend-inner-icon="mdi-magnify"
                    density="compact"
                    hide-details
                    clearable
                    data-testid="map-filter-search"
                />
                <v-select
                    v-model="selectedDifficulty"
                    :label="gradeColumnTitle"
                    :items="difficulties"
                    item-title="text"
                    item-value="value"
                    density="compact"
                    hide-details
                    clearable
                    data-testid="map-filter-grade"
                />
                <v-select
                    :model-value="selectedWallId"
                    :items="wallItems"
                    :label="$t('map.wall')"
                    density="compact"
                    hide-details
                    clearable
                    data-testid="map-filter-wall"
                    @update:model-value="selectWall($event ?? null)"
                />
                <v-btn-toggle
                    v-if="isLoggedIn"
                    v-model="sentFilter"
                    density="compact"
                    variant="outlined"
                    divided
                    mandatory
                    data-testid="map-filter-sent"
                >
                    <v-btn value="all">{{ $t('filter.all') }}</v-btn>
                    <v-btn value="unsent" data-testid="map-filter-unsent">
                        {{ $t('map.unsent') }}
                    </v-btn>
                    <v-btn value="sent">{{ $t('ticks.sent') }}</v-btn>
                </v-btn-toggle>
            </div>
            <template #actions>
                <v-btn variant="text" @click="resetFilters">
                    {{ $t('map.clearFilters') }}
                </v-btn>
                <v-btn
                    color="primary"
                    variant="flat"
                    data-testid="map-filter-apply"
                    @click="filtersOpen = false"
                >
                    {{ $t('map.showResults', { n: matchingCount }) }}
                </v-btn>
            </template>
        </LayoutDialogShell>

        <TickDialog
            v-if="isLoggedIn"
            v-model="tickOpen"
            :route-id="tickRouteId"
            @saved="refreshTickedRoutes()"
        />
    </div>
</template>

<script setup lang="ts">
import type {
    RouteListItem,
    RouteScoreRecord,
    WallRecord,
} from '~/types/models'
import { sanitizeGymMap } from '#shared/utils/mapGeometry'
import { normalizeCreators } from '#shared/utils/formatting'
import { routesOnWall, toMapWalls } from '~/utils/gymMap'

definePageMeta({ footer: false })

const MAP_ROUTE_FIELDS =
    'id,name,color,grade,grade_system,grade_index,anchor_point,location,type,comment,creator,screw_date,wall,wall_position,average_rating,ratings_count'
const TYPE_STORAGE_KEY = 'map-route-type'

const { t } = useI18n()
const pb = usePocketbase()
const route = useRoute()
const router = useRouter()
const { polite: announce } = useAnnouncer()
const { mdAndUp } = useDisplay()
const isLoggedIn = computed(() => pb.authStore.isValid)
const { tickedRouteIds, refreshTickedRoutes } = useTickedRoutes()
const { gradeColumnTitle } = useGradeSystems()
const {
    searchRouteName,
    selectedDifficulty,
    difficulties,
    pbFilter,
    clearFilters,
} = useRouteFilters()
const mapType = ref<'' | 'Boulder' | 'Route'>('')

useSeoMeta({
    title: () => t('page.title.map'),
    description: () => t('map.description'),
})

const { data: locations } = await useLocations()
const mappedLocations = computed(() =>
    locations.value.filter((record) => sanitizeGymMap(record.map)),
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
    set: (id: string) => void router.replace({ query: { location: id } }),
})
const location = computed(() =>
    locations.value.find((record) => record.id === locationId.value),
)
const map = computed(() => sanitizeGymMap(location.value?.map))

const { data: walls, refresh: refreshWalls } = await useAsyncData(
    'map-walls',
    () =>
        locationId.value
            ? pb.collection('walls').getFullList<WallRecord>({
                  filter: pb.filter('location = {:id}', {
                      id: locationId.value,
                  }),
                  sort: 'sort,name',
                  requestKey: 'mapWalls',
              })
            : Promise.resolve([]),
    { watch: [locationId], default: () => [] },
)

const { data: routeRecords, refresh: refreshRoutes } = await useAsyncData(
    'map-routes',
    () =>
        locationId.value
            ? pb.collection('averageRating').getFullList<RouteScoreRecord>({
                  filter: pb.filter('archived = false && location = {:id}', {
                      id: locationId.value,
                  }),
                  fields: MAP_ROUTE_FIELDS,
                  requestKey: 'mapRoutes',
              })
            : Promise.resolve([]),
    { watch: [locationId], default: () => [] },
)

const allRoutes = computed<RouteListItem[]>(() =>
    routeRecords.value.map((record) => {
        const hasRatings =
            Number(record.ratings_count ?? 0) > 0 &&
            typeof record.average_rating === 'number'
        return {
            ...record,
            creator: normalizeCreators(record.creator),
            has_ratings: hasRatings,
            score: hasRatings ? record.average_rating : undefined,
        }
    }),
)
const routes = computed(() =>
    mapType.value
        ? allRoutes.value.filter((item) => item.type === mapType.value)
        : allRoutes.value,
)

const sentFilter = ref<'all' | 'sent' | 'unsent'>('all')

const { data: serverMatches } = useAsyncData(
    'map-matching',
    () =>
        locationId.value && pbFilter.value
            ? pb.collection('averageRating').getFullList<{ id: string }>({
                  filter: `archived = false && location = "${locationId.value}" && (${pbFilter.value})`,
                  fields: 'id',
                  requestKey: 'mapMatching',
              })
            : Promise.resolve(null),
    { watch: [pbFilter, locationId], server: false, default: () => null },
)

const matchingIds = computed<Set<string> | null>(() => {
    const hasServerFilter = !!pbFilter.value
    const hasSentFilter = isLoggedIn.value && sentFilter.value !== 'all'
    if (!hasServerFilter && !hasSentFilter) return null
    const serverIds = hasServerFilter
        ? new Set((serverMatches.value ?? []).map((match) => match.id))
        : null
    return new Set(
        routes.value
            .filter((item) => !serverIds || serverIds.has(item.id))
            .filter(
                (item) =>
                    !hasSentFilter ||
                    tickedRouteIds.value.has(item.id) ===
                        (sentFilter.value === 'sent'),
            )
            .map((item) => item.id),
    )
})

const matchingRoutes = computed(() =>
    matchingIds.value
        ? routes.value.filter((item) => matchingIds.value!.has(item.id))
        : routes.value,
)
const matchingCount = computed(() => matchingRoutes.value.length)
const activeCount = computed(
    () =>
        [
            searchRouteName.value,
            selectedDifficulty.value,
            isLoggedIn.value && sentFilter.value !== 'all',
        ].filter(Boolean).length,
)

watch(matchingCount, (count) => {
    if (matchingIds.value) announce(t('climbing.routesFound', { n: count }))
})

const typeOptions = computed(() => [
    { value: '', label: t('filter.all') },
    { value: 'Boulder', label: t('map.boulders') },
    { value: 'Route', label: t('map.routes') },
])

const mapWalls = computed(() =>
    map.value ? toMapWalls(walls.value, map.value) : [],
)
const wallItems = computed(() =>
    mapWalls.value.map((wall) => ({ title: wall.name, value: wall.id })),
)

const selectedWallId = computed(() => (route.query.wall as string) || null)
const selectedRouteId = computed(() => (route.query.route as string) || null)
const selectedRoute = computed(
    () =>
        allRoutes.value.find((item) => item.id === selectedRouteId.value) ??
        null,
)
const mapViewRef = useTemplateRef<{
    focusWall: (id: string) => void
    focusRoute: (id: string) => void
    fitAll: (animate?: boolean) => void
}>('mapViewRef')

function setQuery(patch: Record<string, string | null>) {
    const query = { ...route.query, ...patch }
    for (const key of Object.keys(patch)) if (!patch[key]) delete query[key]
    void router.replace({ query })
}

function selectWall(wallId: string | null) {
    setQuery({ wall: wallId, route: null })
    if (wallId) mapViewRef.value?.focusWall(wallId)
}

function selectRoute(routeId: string | null) {
    setQuery({ route: routeId })
}

function onListSelect(routeId: string) {
    const route = allRoutes.value.find((item) => item.id === routeId)
    if (route?.wall && mapWalls.value.some((wall) => wall.id === route.wall))
        showOnMap(routeId)
    else {
        listOpen.value = false
        selectRoute(routeId)
    }
}

function showOnMap(routeId: string) {
    listOpen.value = false
    selectRoute(routeId)
    mapViewRef.value?.focusRoute(routeId)
}

const listOpen = ref(false)
const filtersOpen = ref(false)

const selectedWall = computed(() =>
    mapWalls.value.find((wall) => wall.id === selectedWallId.value),
)
const listTitle = computed(() =>
    selectedWall.value ? selectedWall.value.name : t('map.allRoutes'),
)
const listCount = computed(() =>
    listGroups.value.reduce((sum, group) => sum + group.routes.length, 0),
)
const listBarText = computed(() =>
    selectedWall.value
        ? t('map.showWallList', {
              name: selectedWall.value.name,
              n: routesOnWall(matchingRoutes.value, selectedWall.value.id)
                  .length,
          })
        : t('map.showList', { n: matchingCount.value }),
)

const listGroups = computed(() => {
    if (selectedWall.value)
        return [
            {
                id: selectedWall.value.id,
                name: selectedWall.value.name,
                routes: routesOnWall(
                    matchingRoutes.value,
                    selectedWall.value.id,
                ),
            },
        ].filter((group) => group.routes.length)
    const groups = mapWalls.value.map((wall) => ({
        id: wall.id,
        name: wall.name,
        routes: routesOnWall(matchingRoutes.value, wall.id),
    }))
    const wallIds = new Set(mapWalls.value.map((wall) => wall.id))
    groups.push({
        id: 'unplaced',
        name: t('map.notOnMap'),
        routes: matchingRoutes.value.filter(
            (item) => !item.wall || !wallIds.has(item.wall),
        ),
    })
    return groups.filter((group) => group.routes.length)
})

watch(mapType, (type) => {
    try {
        localStorage.setItem(TYPE_STORAGE_KEY, type)
    } catch {}
})

function resetFilters() {
    clearFilters()
    sentFilter.value = 'all'
}

const tickOpen = ref(false)
const tickRouteId = ref<string | null>(null)

function openTick(routeId: string) {
    tickRouteId.value = routeId
    tickOpen.value = true
}

const { subscribe } = usePbSubscription()

function restoreMapType() {
    try {
        const stored = localStorage.getItem(TYPE_STORAGE_KEY)
        if (stored === 'Boulder' || stored === 'Route') mapType.value = stored
    } catch {}
}

onMounted(async () => {
    restoreMapType()
    await nextTick()
    if (selectedRouteId.value)
        mapViewRef.value?.focusRoute(selectedRouteId.value)
    else if (selectedWallId.value)
        mapViewRef.value?.focusWall(selectedWallId.value)
    await subscribe('routes', () => void refreshRoutes())
    await subscribe('walls', () => void refreshWalls())
})
</script>

<style scoped>
.map-page {
    position: relative;
    display: flex;
    flex-direction: column;
    height: calc(
        100dvh - var(--v-layout-top, 64px) - var(--v-layout-bottom, 0px)
    );
    min-height: 420px;
}

.map-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    border-bottom: 1px solid
        rgba(var(--v-border-color), var(--v-border-opacity));
}

.map-title {
    flex: 1 1 auto;
    min-width: 0;
    font-weight: 600;
    font-size: 1.125rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.map-location {
    flex: 1 1 auto;
    min-width: 0;
    max-width: 240px;
}

.map-header :deep(.v-btn-toggle) {
    flex-shrink: 0;
    overflow: visible;
}

.map-body {
    display: flex;
    flex: 1;
    min-height: 0;
}

.map-side {
    display: flex;
    flex-direction: column;
    width: 380px;
    flex-shrink: 0;
    min-height: 0;
    border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.map-side__header {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 4px 8px 4px 16px;
    border-bottom: 1px solid
        rgba(var(--v-border-color), var(--v-border-opacity));
}

.map-side__list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 8px 12px;
}

.map-stage {
    position: relative;
    flex: 1;
    min-height: 0;
}

.map-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 48px;
}

.map-filter-fab {
    position: absolute;
    right: 16px;
    bottom: 16px;
}

.map-route-card {
    position: absolute;
    left: 50%;
    bottom: 16px;
    transform: translateX(-50%);
    width: min(480px, calc(100% - 96px));
    max-height: 60%;
    overflow-y: auto;
}

.map-list-bar {
    display: flex;
    height: 44px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 0 16px;
    border: 0;
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    background: rgb(var(--v-theme-surface));
    color: rgb(var(--v-theme-on-surface));
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-size: 0.8125rem;
    cursor: pointer;
}

.map-list-bar:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: -2px;
}

@media (max-width: 599.98px) {
    .map-route-card {
        width: calc(100% - 32px);
        bottom: 80px;
    }
}
</style>
