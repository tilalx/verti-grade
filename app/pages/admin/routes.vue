<template>
    <v-container fluid class="route-manager">
        <v-row class="mb-4">
            <v-col
                cols="12"
                class="d-flex flex-column flex-sm-row align-sm-center justify-space-between gap-4"
            >
                <h1 class="route-manager__page-title">
                    {{ $t('routes.dashboard') }}
                </h1>
                <div class="d-flex align-center ga-2">
                    <v-btn
                        color="primary"
                        variant="tonal"
                        rounded="lg"
                        prepend-icon="mdi-routes"
                        @click="routeFormRef.open()"
                    >
                        {{ $t('climbing.create') }}
                    </v-btn>
                    <v-btn
                        color="primary"
                        variant="tonal"
                        rounded="lg"
                        prepend-icon="mdi-file-import-outline"
                        @click="importRouteRef.open()"
                    >
                        {{ $t('actions.import') }}
                    </v-btn>
                </div>
            </v-col>
        </v-row>

        <RouteFormDialog
            ref="routeFormRef"
            @saved="reloadRoutes"
            @deleted="reloadRoutes"
        />
        <ImportRoute ref="importRouteRef" @closed="reloadRoutes" />

        <v-row>
            <v-col>
                <FilterBar
                    v-model="searchRouteName"
                    :search-label="$t('climbing.searchRouteName')"
                    :active-filter-count="activeFilterCount"
                    @clear="clearFilters"
                >
                    <template #filters>
                        <v-row density="comfortable" align="center">
                            <!-- Sorting for the mobile card list (desktop sorts via table headers) -->
                            <v-col v-if="isMobile" cols="12" sm="6">
                                <RouteSortControl
                                    :model-value="tableOptions.sortBy"
                                    :items="sortItemsMobile"
                                    @update:modelValue="onMobileSortChange"
                                />
                            </v-col>
                            <v-col cols="6" sm="3">
                                <v-select
                                    :label="$t('climbing.difficulty')"
                                    :items="difficulties"
                                    v-model="selectedDifficulty"
                                    item-title="text"
                                    item-value="value"
                                    clearable
                                    hide-details
                                    density="compact"
                                    variant="outlined"
                                    rounded="lg"
                                />
                            </v-col>
                            <v-col cols="6" sm="3">
                                <v-select
                                    :label="$t('climbing.type')"
                                    :items="types"
                                    v-model="selectedType"
                                    item-title="text"
                                    item-value="value"
                                    clearable
                                    hide-details
                                    density="compact"
                                    variant="outlined"
                                    rounded="lg"
                                />
                            </v-col>
                            <v-col cols="6" sm="3">
                                <v-select
                                    :label="$t('climbing.location')"
                                    :items="locations"
                                    v-model="selectedLocation"
                                    item-title="text"
                                    item-value="value"
                                    clearable
                                    hide-details
                                    density="compact"
                                    variant="outlined"
                                    rounded="lg"
                                />
                            </v-col>
                            <v-col
                                cols="6"
                                sm="auto"
                                class="d-flex align-center"
                            >
                                <v-chip
                                    :color="
                                        displayArchived ? 'warning' : undefined
                                    "
                                    :variant="
                                        displayArchived ? 'tonal' : 'outlined'
                                    "
                                    prepend-icon="mdi-archive-outline"
                                    @click="displayArchived = !displayArchived"
                                >
                                    {{ $t('filter.archived') }}
                                </v-chip>
                            </v-col>
                        </v-row>
                    </template>
                </FilterBar>

                <v-row>
                    <v-col cols="12">
                        <div class="route-manager__actions">
                            <v-btn
                                @click="selectAll"
                                color="primary"
                                variant="tonal"
                            >
                                <v-icon start>
                                    {{
                                        areAllSelected()
                                            ? 'mdi-checkbox-marked-outline'
                                            : 'mdi-checkbox-blank-outline'
                                    }}
                                </v-icon>
                                {{
                                    areAllSelected()
                                        ? $t('actions.deselect_all')
                                        : $t('actions.select_all')
                                }}
                            </v-btn>
                            <v-btn
                                v-if="hasSelection"
                                @click="printSelected"
                                color="success"
                                variant="tonal"
                                :loading="exportingFormat === 'pdf'"
                                :disabled="
                                    !!exportingFormat &&
                                    exportingFormat !== 'pdf'
                                "
                            >
                                <v-icon start>mdi-printer</v-icon>
                                {{ $t('actions.print') }}
                            </v-btn>
                            <v-btn
                                v-if="hasSelection"
                                @click="exportSelectedExcel"
                                color="success"
                                variant="tonal"
                                :loading="exportingFormat === 'xlsx'"
                                :disabled="
                                    !!exportingFormat &&
                                    exportingFormat !== 'xlsx'
                                "
                            >
                                <v-icon start>mdi-file-excel</v-icon>
                                XLSX
                            </v-btn>
                            <v-btn
                                v-if="hasSelection"
                                @click="exportSelectedJson"
                                color="success"
                                variant="tonal"
                                :loading="exportingFormat === 'json'"
                                :disabled="
                                    !!exportingFormat &&
                                    exportingFormat !== 'json'
                                "
                            >
                                <v-icon start>mdi-code-json</v-icon>
                                JSON
                            </v-btn>
                            <v-btn
                                v-if="hasSelection"
                                @click="handleArchiveClick"
                                color="warning"
                                variant="tonal"
                            >
                                <v-icon start>mdi-archive</v-icon>
                                {{ $t('actions.archive') }}
                            </v-btn>
                        </div>
                    </v-col>
                </v-row>

                <v-data-table-server
                    v-if="!isMobile"
                    class="route-manager__table"
                    :headers="tableHeaders"
                    :items="routes"
                    :items-length="totalItems"
                    :items-per-page="tableOptions.itemsPerPage"
                    :sort-by="tableOptions.sortBy"
                    :loading="loading"
                    :items-per-page-options="pageSizeOptions"
                    item-value="id"
                    density="comfortable"
                    @update:options="loadRoutes"
                >
                    <template #item.selected="{ item }">
                        <v-checkbox
                            :model-value="item.selected"
                            color="primary"
                            hide-details
                            density="compact"
                            @update:modelValue="
                                updateRouteSelection(item, $event)
                            "
                        />
                    </template>
                    <template #item.color="{ item }">
                        <v-avatar :color="item.color" size="24" />
                    </template>
                    <template #item.name="{ item }">
                        <div class="route-manager__name">
                            <span class="route-manager__name-text">{{
                                item.name
                            }}</span>
                            <v-icon
                                v-if="item.has_ratings"
                                color="yellow-darken-2"
                                size="small"
                            >
                                mdi-star-circle
                            </v-icon>
                            <v-chip
                                v-if="item.archived"
                                size="x-small"
                                variant="outlined"
                            >
                                {{ $t('filter.archived') }}
                            </v-chip>
                        </div>
                    </template>
                    <template #item.difficulty="{ item }">
                        {{ formatDifficulty(item) }}
                    </template>
                    <template #item.anchor_point="{ item }">
                        {{ formatAnchorPoint(item.anchor_point) }}
                    </template>
                    <template #item.comment="{ item }">
                        <div class="route-manager__comment">
                            {{ item.comment }}
                        </div>
                    </template>
                    <template #item.creator="{ item }">
                        <div class="route-manager__creator-chips">
                            <v-chip
                                v-for="creator in item.creator"
                                :key="creator"
                                size="small"
                                class="ma-0"
                                >{{ creator }}</v-chip
                            >
                        </div>
                    </template>
                    <template #item.score="{ item }">
                        {{ formatScore(item) }}
                    </template>
                    <template #item.actions="{ item }">
                        <div class="route-manager__row-actions">
                            <v-btn
                                icon
                                size="small"
                                class="mr-1"
                                @click="routeFormRef.open(item)"
                            >
                                <v-icon>mdi-pencil</v-icon>
                            </v-btn>
                            <RouteDetails :route_id="item.id" />
                        </div>
                    </template>
                </v-data-table-server>

                <div v-else class="route-manager__mobile-section">
                    <v-skeleton-loader
                        v-if="loading && routes.length === 0"
                        type="card"
                        class="mt-4"
                        :elevation="0"
                    />
                    <div
                        v-else-if="!loading && routes.length === 0"
                        class="route-manager__mobile-empty"
                    >
                        <v-icon size="x-large" class="mb-2"
                            >mdi-magnify-remove-outline</v-icon
                        >
                        <p class="text-body-1 mb-0">
                            {{ $t('table.no_data') }}
                        </p>
                    </div>
                    <v-row v-else class="mt-2">
                        <v-col
                            v-for="route in routes"
                            :key="route.id"
                            cols="12"
                        >
                            <RouteCard
                                :route="route"
                                selectable
                                :model-value="route.selected"
                                @update:model-value="
                                    updateRouteSelection(route, $event)
                                "
                            >
                                <template #actions>
                                    <RouteDetails :route_id="route.id" />
                                    <v-btn
                                        icon
                                        size="small"
                                        @click="routeFormRef.open(route)"
                                    >
                                        <v-icon>mdi-pencil</v-icon>
                                    </v-btn>
                                </template>
                            </RouteCard>
                        </v-col>
                    </v-row>

                    <div class="route-manager__mobile-pagination">
                        <v-pagination
                            :model-value="tableOptions.page"
                            :length="pageLength"
                            total-visible="5"
                            size="small"
                            @update:modelValue="onMobilePageChange"
                        />
                        <v-select
                            :model-value="tableOptions.itemsPerPage"
                            :items="pageSizeOptions"
                            density="compact"
                            hide-details
                            variant="outlined"
                            class="route-manager__page-size"
                            @update:modelValue="onMobileItemsPerPageChange"
                        />
                    </div>
                </div>
            </v-col>
        </v-row>

        <ConfirmDialog
            v-model="showArchiveConfirmation"
            :message="$t('notifications.archiveMoreItems')"
            confirm-color="warning"
            :confirm-text="$t('actions.archive')"
            @confirm="archiveSelected"
        />
    </v-container>
</template>

<script setup>
import {
    formatDifficulty,
    formatAnchorPoint,
    formatScore,
    normalizeCreators,
} from '~/utils/formatting'
import { toPbSort } from '~/utils/sorting'

definePageMeta({
    authRequired: true,
    middleware: ['auth'],
    requiredPermission: 'manage_routes',
})

const pb = usePocketbase()
const { t, locale } = useI18n()
const { smAndDown } = useDisplay()

const isMobile = computed(() => smAndDown.value)

const {
    searchRouteName,
    selectedDifficulty,
    selectedType,
    selectedLocation,
    difficulties,
    types,
    locations,
    activeFilterCount: routeFilterCount,
    pbFilter: baseFilter,
    clearFilters: clearRouteFilters,
} = useRouteFilters()

const displayArchived = ref(false)

const activeFilterCount = computed(
    () => routeFilterCount.value + (displayArchived.value ? 1 : 0),
)

function clearFilters() {
    clearRouteFilters()
    displayArchived.value = false
}

const showArchiveConfirmation = ref(false)

const routes = ref([])
const totalItems = ref(0)
const loading = ref(false)

const tableOptions = reactive({
    page: 1,
    itemsPerPage: 25,
    sortBy: [{ key: 'screw_date', order: 'desc' }],
})

const selectedRouteIds = ref(new Set())

const createAllRouteIdsCache = () => ({
    key: null,
    ids: [],
})

const allRouteIdsCache = ref(createAllRouteIdsCache())

const pageSizeOptions = [10, 25, 50, 100]

const routeFormRef = useTemplateRef('routeFormRef')
const importRouteRef = useTemplateRef('importRouteRef')

const tableHeaders = computed(() => [
    { title: '', key: 'selected', sortable: false, width: 56 },
    { title: t('climbing.color'), key: 'color', sortable: false },
    { title: t('climbing.routename'), key: 'name' },
    { title: t('climbing.difficulty'), key: 'difficulty' },
    { title: t('climbing.anchor_point'), key: 'anchor_point' },
    { title: t('climbing.comment'), key: 'comment', sortable: false },
    { title: t('routes.route_setter'), key: 'creator', sortable: false },
    { title: t('climbing.location'), key: 'location' },
    { title: t('climbing.type'), key: 'type' },
    { title: t('ratings.score'), key: 'score' },
    {
        title: t('table.actions'),
        key: 'actions',
        sortable: false,
        align: 'end',
    },
])

const pbFilter = computed(() => {
    const parts = []
    if (!displayArchived.value) parts.push('archived = false')
    const base = baseFilter.value
    if (base) parts.push(base)
    return parts.join(' && ')
})

const buildSelectionCacheKey = () =>
    JSON.stringify({
        filter: pbFilter.value || null,
    })

const invalidateAllRouteIdsCache = () => {
    allRouteIdsCache.value = createAllRouteIdsCache()
}

const selectedCount = computed(() => selectedRouteIds.value.size)
const hasSelection = computed(() => selectedCount.value > 0)
const pageLength = computed(() =>
    Math.max(1, Math.ceil(totalItems.value / tableOptions.itemsPerPage)),
)

const areAllSelected = () =>
    totalItems.value > 0 && selectedCount.value >= totalItems.value

const applySelectionToRoutes = () => {
    routes.value = routes.value.map((route) => ({
        ...route,
        selected: selectedRouteIds.value.has(route.id),
    }))
}

const updateRouteSelection = (route, isSelected) => {
    const next = new Set(selectedRouteIds.value)
    if (isSelected) {
        next.add(route.id)
    } else {
        next.delete(route.id)
    }
    selectedRouteIds.value = next
    applySelectionToRoutes()
}

const selectAll = async () => {
    if (areAllSelected()) {
        clearSelection()
        return
    }

    try {
        const ids = await loadAllRouteIds()
        selectedRouteIds.value = new Set(ids)
        applySelectionToRoutes()
    } catch (error) {
        console.error('Failed to select all routes:', error)
    }
}

const clearSelection = () => {
    selectedRouteIds.value = new Set()
    applySelectionToRoutes()
}

const removeSelectedIds = (ids) => {
    if (!ids.length) {
        return
    }

    const next = new Set(selectedRouteIds.value)
    ids.forEach((id) => next.delete(id))
    selectedRouteIds.value = next
    applySelectionToRoutes()
}

const toPbSortRoutes = (sortByArr) =>
    toPbSort(sortByArr, '-created', { score: 'average_rating' })

const sortItemsMobile = computed(() => [
    { title: t('table.created_at'), key: 'screw_date', defaultOrder: 'desc' },
    { title: t('ratings.score'), key: 'score', defaultOrder: 'desc' },
    { title: t('climbing.routename'), key: 'name' },
    { title: t('climbing.difficulty'), key: 'difficulty' },
    { title: t('climbing.anchor_point'), key: 'anchor_point' },
    { title: t('climbing.location'), key: 'location' },
    { title: t('climbing.type'), key: 'type' },
])

const onMobileSortChange = (sortBy) => {
    void loadRoutes({ page: 1, sortBy })
}

const loadAllRouteIds = async () => {
    const cacheKey = buildSelectionCacheKey()

    if (
        allRouteIdsCache.value.key === cacheKey &&
        allRouteIdsCache.value.ids.length
    ) {
        return allRouteIdsCache.value.ids
    }

    try {
        const fullList = await pb.collection('routes').getFullList(200, {
            fields: 'id',
            filter: pbFilter.value || undefined,
        })

        const ids = fullList
            .map((route) => route.id)
            .filter((id) => typeof id === 'string' && id.length > 0)

        allRouteIdsCache.value = {
            key: cacheKey,
            ids,
        }

        return ids
    } catch (error) {
        console.error('Failed to load all route ids:', error)
        allRouteIdsCache.value = createAllRouteIdsCache()
        throw error
    }
}

const formatDate = (value) => {
    if (!value) {
        return '—'
    }

    try {
        return new Date(value).toLocaleDateString(locale.value ?? undefined)
    } catch (error) {
        console.error('Failed to format date:', error)
        return '—'
    }
}

const generateFilename = () => {
    const name = locale.value === 'de' ? 'kletterrouten' : 'climbing-routes'
    const date = new Date()
    const pad = (n) => n.toString().padStart(2, '0')
    const hh = pad(date.getHours())
    const mm = pad(date.getMinutes())
    const dd = pad(date.getDate())
    const MM = pad(date.getMonth() + 1)
    const yyyy = date.getFullYear()
    const timestamp = `${hh}-${mm}_${dd}.${MM}.${yyyy}`
    return `${name}-${timestamp}`
}

const loadRoutes = async (options = {}) => {
    const { page, itemsPerPage, sortBy } = options

    if (typeof page === 'number') {
        tableOptions.page = page
    }

    if (typeof itemsPerPage === 'number') {
        tableOptions.itemsPerPage = itemsPerPage
    }

    if (Array.isArray(sortBy)) {
        tableOptions.sortBy = sortBy
    }

    loading.value = true

    try {
        const list = await pb
            .collection('averageRating')
            .getList(tableOptions.page, tableOptions.itemsPerPage, {
                filter: pbFilter.value || undefined,
                sort: toPbSortRoutes(tableOptions.sortBy),
                requestKey: 'adminRoutesList',
            })

        const normalizedRoutes = list.items.map((route) => {
            const hasRatings =
                Number(route.ratings_count ?? 0) > 0 &&
                typeof route.average_rating === 'number'

            return {
                ...route,
                comment: typeof route.comment === 'string' ? route.comment : '',
                creator: normalizeCreators(route.creator),
                score: hasRatings ? route.average_rating : null,
                has_ratings: hasRatings,
                selected: selectedRouteIds.value.has(route.id),
            }
        })

        routes.value = normalizedRoutes
        totalItems.value = list.totalItems
    } catch (error) {
        console.error('Failed to load routes:', error)
    } finally {
        loading.value = false
    }
}

const reloadRoutes = async () => {
    invalidateAllRouteIdsCache()
    await loadRoutes({
        page: tableOptions.page,
        itemsPerPage: tableOptions.itemsPerPage,
        sortBy: tableOptions.sortBy,
    })

    const maxPage = Math.max(
        1,
        Math.ceil(totalItems.value / tableOptions.itemsPerPage),
    )
    if (tableOptions.page > maxPage) {
        tableOptions.page = maxPage
        await loadRoutes({
            page: tableOptions.page,
            itemsPerPage: tableOptions.itemsPerPage,
            sortBy: tableOptions.sortBy,
        })
    }
}

const handleArchiveClick = () => {
    if (selectedCount.value > 1) {
        showArchiveConfirmation.value = true
    } else {
        void archiveSelected()
    }
}

const archiveSelected = async () => {
    const ids = Array.from(selectedRouteIds.value)
    if (!ids.length) {
        return
    }

    try {
        const batch = pb.createBatch()
        ids.forEach((id) => {
            batch.collection('routes').update(id, { archived: true })
        })
        await batch.send()
        invalidateAllRouteIdsCache()
        removeSelectedIds(ids)
        showArchiveConfirmation.value = false
        await reloadRoutes()
    } catch (error) {
        console.error('Exception in archiveSelected:', error)
    }
}

const exportingFormat = ref(null)

const downloadExport = async (endpoint, extension, mimeType) => {
    const ids = Array.from(selectedRouteIds.value)
    if (!ids.length || exportingFormat.value) return

    exportingFormat.value = extension
    try {
        const headers = { 'Content-Type': 'application/json' }
        if (pb.authStore.token) {
            headers.Authorization = pb.authStore.token
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ids }),
        })

        if (!response.ok) {
            throw new Error(`Export failed with status ${response.status}`)
        }

        let blob
        if (extension === 'json') {
            const text = JSON.stringify(await response.json(), null, 2)
            blob = new Blob([text], { type: mimeType })
        } else {
            blob = new Blob([await response.blob()], { type: mimeType })
        }

        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${generateFilename()}.${extension}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    } catch (error) {
        console.error(`Export error (${extension}):`, error)
    } finally {
        exportingFormat.value = null
    }
}

const printSelected = () =>
    downloadExport('/api/ui/pdf', 'pdf', 'application/pdf')
const exportSelectedExcel = () =>
    downloadExport(
        '/api/ui/xlsx',
        'xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
const exportSelectedJson = () =>
    downloadExport('/api/ui/json', 'json', 'application/json')

const onMobilePageChange = (value) => {
    if (value === tableOptions.page) {
        return
    }

    void loadRoutes({ page: value })
}

const onMobileItemsPerPageChange = (value) => {
    const size = Number(value)
    if (!size || size === tableOptions.itemsPerPage) {
        return
    }

    clearSelection()
    void loadRoutes({ page: 1, itemsPerPage: size })
}

let filterDebounceTimer = null
let subscriptionDebounceTimer = null

watch(pbFilter, () => {
    if (filterDebounceTimer) {
        clearTimeout(filterDebounceTimer)
    }

    filterDebounceTimer = setTimeout(() => {
        invalidateAllRouteIdsCache()
        tableOptions.page = 1
        void loadRoutes({
            page: 1,
            itemsPerPage: tableOptions.itemsPerPage,
            sortBy: tableOptions.sortBy,
        })
    }, 300)
})

const queueReload = () => {
    clearTimeout(subscriptionDebounceTimer)
    subscriptionDebounceTimer = setTimeout(() => {
        void (async () => {
            invalidateAllRouteIdsCache()
            await reloadRoutes()
        })()
    }, 250)
}

const { subscribe } = usePbSubscription()

onMounted(async () => {
    await loadRoutes({
        page: tableOptions.page,
        itemsPerPage: tableOptions.itemsPerPage,
        sortBy: tableOptions.sortBy,
    })
    await Promise.all([
        subscribe('routes', queueReload),
        subscribe('ratings', queueReload),
    ])
})

onBeforeUnmount(() => {
    clearTimeout(filterDebounceTimer)
    clearTimeout(subscriptionDebounceTimer)
})

useHead(() => ({
    title: t('page.title.dashboard'),
    meta: [
        {
            name: 'description',
            content: t('page.content.dashboard'),
        },
    ],
}))
</script>

<style scoped>
.route-manager {
    padding-bottom: 64px;
}

.route-manager__page-title {
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: rgb(var(--v-theme-on-background));
}

.route-manager__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 16px;
}

.route-manager__table {
    margin-top: 16px;
}

.route-manager__comment {
    max-width: 260px;
    white-space: normal;
    word-break: break-word;
}

.route-manager__name {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
}

.route-manager__name-text {
    font-weight: 600;
}

.route-manager__creator-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.route-manager__row-actions {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
}

.route-manager__mobile-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.route-manager__mobile-empty {
    text-align: center;
    padding: 32px 16px;
    color: rgba(var(--v-theme-on-surface), 0.7);
}

.route-manager__mobile-pagination {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: space-between;
    align-items: center;
}

.route-manager__page-size {
    max-width: 140px;
}
</style>
