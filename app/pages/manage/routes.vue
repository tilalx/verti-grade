<template>
    <v-container class="route-manager">
        <LayoutPageHeader :title="$t('routes.dashboard')">
            <template #actions>
                <v-btn
                    color="primary"
                    prepend-icon="mdi-routes"
                    data-testid="routes-create-open"
                    @click="routeFormRef?.open()"
                >
                    {{ $t('climbing.create') }}
                </v-btn>
                <v-btn
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-file-import-outline"
                    data-testid="routes-import-open"
                    @click="importRouteRef?.open()"
                >
                    {{ $t('actions.import') }}
                </v-btn>
            </template>
        </LayoutPageHeader>

        <RouteFormDialog
            ref="routeFormRef"
            @saved="onRouteSaved"
            @deleted="onRouteDeleted"
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
                                    data-testid="routes-filter-difficulty"
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
                                    data-testid="routes-filter-type"
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
                                    data-testid="routes-filter-location"
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
                                    data-testid="routes-filter-archived"
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
                                data-testid="routes-select-all"
                            >
                                <v-icon start>
                                    {{
                                        areAllSelected
                                            ? 'mdi-checkbox-marked-outline'
                                            : 'mdi-checkbox-blank-outline'
                                    }}
                                </v-icon>
                                {{
                                    areAllSelected
                                        ? $t('actions.deselect_all')
                                        : $t('actions.select_all')
                                }}
                            </v-btn>
                            <v-btn
                                v-if="hasSelection"
                                @click="openExportOptions('pdf')"
                                color="success"
                                variant="tonal"
                                :loading="exportingFormat === 'pdf'"
                                :disabled="
                                    !!exportingFormat &&
                                    exportingFormat !== 'pdf'
                                "
                                data-testid="routes-export-pdf"
                            >
                                <v-icon start>mdi-printer</v-icon>
                                {{ $t('actions.print') }}
                            </v-btn>
                            <v-btn
                                v-if="hasSelection"
                                @click="openExportOptions('xlsx')"
                                color="success"
                                variant="tonal"
                                :loading="exportingFormat === 'xlsx'"
                                :disabled="
                                    !!exportingFormat &&
                                    exportingFormat !== 'xlsx'
                                "
                                data-testid="routes-export-xlsx"
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
                                data-testid="routes-export-json"
                            >
                                <v-icon start>mdi-code-json</v-icon>
                                JSON
                            </v-btn>
                            <v-btn
                                v-if="hasSelection"
                                @click="handleArchiveClick"
                                color="warning"
                                variant="tonal"
                                data-testid="routes-archive-selected"
                            >
                                <v-icon start>mdi-archive-outline</v-icon>
                                {{ $t('actions.archive') }}
                            </v-btn>
                        </div>
                    </v-col>
                </v-row>

                <div v-if="!isMobile" data-testid="routes-table">
                    <v-data-table-server
                        class="route-manager__table"
                        :headers="tableHeaders"
                        :items="routes"
                        :items-length="totalItems"
                        :items-per-page="tableOptions.itemsPerPage"
                        :sort-by="tableOptions.sortBy"
                        :loading="loading"
                        :items-per-page-options="pageSizeOptions"
                        :no-data-text="$t('table.no_data')"
                        item-value="id"
                        @update:options="loadRoutes"
                    >
                        <template #item.selected="{ item }">
                            <v-checkbox
                                :model-value="selectedRouteIds.has(item.id)"
                                color="primary"
                                hide-details
                                density="compact"
                                data-testid="routes-row-checkbox"
                                @update:modelValue="
                                    updateRouteSelection(item, !!$event)
                                "
                            />
                        </template>
                        <template #item.color="{ item }">
                            <v-avatar
                                :color="item.color ?? undefined"
                                size="24"
                            />
                        </template>
                        <template #item.name="{ item }">
                            <div
                                class="route-manager__name"
                                :data-testid="`routes-row-${item.id}`"
                            >
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
                        <template #item.location="{ item }">
                            {{ locationName(item) }}
                        </template>
                        <template #item.score="{ item }">
                            {{ formatScore(item) }}
                        </template>
                        <template #item.actions="{ item }">
                            <div class="route-manager__row-actions">
                                <v-btn
                                    icon="mdi-pencil-outline"
                                    variant="text"
                                    size="small"
                                    class="mr-1"
                                    :aria-label="$t('actions.edit')"
                                    data-testid="routes-row-edit"
                                    @click="routeFormRef?.open(item)"
                                />
                                <RouteDetails :route_id="item.id" />
                            </div>
                        </template>
                    </v-data-table-server>
                </div>

                <div v-else class="route-manager__mobile-section">
                    <v-skeleton-loader
                        v-if="loading && routes.length === 0"
                        type="card"
                        class="mt-4"
                        :elevation="0"
                    />
                    <LayoutEmptyState
                        v-else-if="!loading && routes.length === 0"
                        class="mt-4"
                        :title="$t('table.no_data')"
                    />
                    <v-row v-else ref="mobileListRef" class="mt-2">
                        <v-col
                            v-for="route in routes"
                            :key="route.id"
                            cols="12"
                        >
                            <RouteCard
                                :route="route"
                                selectable
                                :model-value="selectedRouteIds.has(route.id)"
                                @update:model-value="
                                    updateRouteSelection(route, $event)
                                "
                            >
                                <template #actions>
                                    <RouteDetails :route_id="route.id" />
                                    <v-btn
                                        icon="mdi-pencil-outline"
                                        variant="text"
                                        size="small"
                                        :aria-label="$t('actions.edit')"
                                        @click="routeFormRef?.open(route)"
                                    />
                                </template>
                            </RouteCard>
                        </v-col>
                    </v-row>

                    <nav
                        class="route-manager__mobile-pagination"
                        :aria-label="$t('table.pagination')"
                        data-testid="routes-mobile-pagination"
                    >
                        <div class="route-manager__pager">
                            <v-btn
                                icon="mdi-chevron-left"
                                variant="text"
                                size="small"
                                :disabled="tableOptions.page <= 1"
                                :aria-label="$t('table.previous_page')"
                                data-testid="routes-mobile-prev"
                                @click="
                                    onMobilePageChange(tableOptions.page - 1)
                                "
                            />
                            <template
                                v-for="(page, index) in pageItems"
                                :key="`${page}-${index}`"
                            >
                                <span
                                    v-if="page === ELLIPSIS"
                                    class="route-manager__page-gap"
                                    aria-hidden="true"
                                    >{{ page }}</span
                                >
                                <v-btn
                                    v-else
                                    :variant="
                                        page === tableOptions.page
                                            ? 'flat'
                                            : 'text'
                                    "
                                    :color="
                                        page === tableOptions.page
                                            ? 'primary'
                                            : undefined
                                    "
                                    :aria-current="
                                        page === tableOptions.page
                                            ? 'page'
                                            : undefined
                                    "
                                    :aria-label="
                                        $t('table.page_of', {
                                            page,
                                            total: pageLength,
                                        })
                                    "
                                    size="small"
                                    class="route-manager__page-btn"
                                    :data-testid="`routes-mobile-goto-${page}`"
                                    @click="onMobilePageChange(page)"
                                >
                                    {{ page }}
                                </v-btn>
                            </template>
                            <v-btn
                                icon="mdi-chevron-right"
                                variant="text"
                                size="small"
                                :disabled="tableOptions.page >= pageLength"
                                :aria-label="$t('table.next_page')"
                                data-testid="routes-mobile-next"
                                @click="
                                    onMobilePageChange(tableOptions.page + 1)
                                "
                            />
                        </div>
                        <v-select
                            :model-value="tableOptions.itemsPerPage"
                            :items="pageSizeOptions"
                            :aria-label="$t('table.rows_per_page')"
                            density="compact"
                            hide-details
                            class="route-manager__page-size"
                            data-testid="routes-mobile-page-size"
                            @update:modelValue="onMobileItemsPerPageChange"
                        />
                    </nav>
                </div>
            </v-col>
        </v-row>

        <ExportOptionsDialog
            v-model="showExportOptions"
            :format="exportFormat"
            @confirm="exportSelected"
        />

        <ConfirmDialog
            v-model="showArchiveConfirmation"
            :message="$t('notifications.archiveMoreItems')"
            confirm-color="warning"
            :confirm-text="$t('actions.archive')"
            @confirm="archiveSelected"
        />
    </v-container>
</template>

<script setup lang="ts">
import { isAbortError } from '~/utils/errors'
import type { ExportOptions } from '~/components/ExportOptionsDialog.vue'
import {
    formatDifficulty,
    formatAnchorPoint,
    formatScore,
    locationName,
    normalizeCreators,
} from '#shared/utils/formatting'
import { toPbSort, type SortOption } from '~/utils/sorting'
import type { RouteListItem, RouteScoreRecord } from '~/types/models'

interface LoadOptions {
    page?: number
    itemsPerPage?: number
    sortBy?: SortOption[]
}

definePageMeta({
    middleware: ['auth'],
    requiredPermission: 'manage_routes',
})

const pb = usePocketbase()
const { t, locale } = useI18n()
const { mdAndDown, width: displayWidth } = useDisplay()
const { notify, error: notifyError } = useNotification()

const isMobile = computed(() => mdAndDown.value)

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

const routes = ref<RouteListItem[]>([])
const totalItems = ref(0)
const loading = ref(false)

const tableOptions = reactive<{
    page: number
    itemsPerPage: number
    sortBy: SortOption[]
}>({
    page: 1,
    itemsPerPage: 25,
    sortBy: [{ key: 'screw_date', order: 'desc' }],
})

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
        align: 'end' as const,
    },
])

const pbFilter = computed(() => {
    const parts = []
    if (!displayArchived.value) parts.push('archived = false')
    const base = baseFilter.value
    if (base) parts.push(base)
    return parts.join(' && ')
})

const {
    selectedRouteIds,
    selectedCount,
    hasSelection,
    areAllSelected,
    update: updateSelection,
    clear: clearSelection,
    remove: removeSelectedIds,
    toggleAll,
    invalidate: invalidateAllRouteIdsCache,
} = useRouteSelection(pbFilter, totalItems)

const { exportingFormat, exportPdf, exportXlsx, exportJson } = useRouteExport()
const selectedIds = () => Array.from(selectedRouteIds.value)

const pageLength = computed(() =>
    Math.max(1, Math.ceil(totalItems.value / tableOptions.itemsPerPage)),
)

const PAGE_BUTTON = 36
const pageWindowSize = computed(() => {
    const spare = displayWidth.value - 32 - 96 - 16 - 2 * PAGE_BUTTON
    return Math.max(1, Math.min(7, Math.floor(spare / PAGE_BUTTON)))
})

const ELLIPSIS = '...' as const

const pageItems = computed(() => {
    const total = pageLength.value
    const current = tableOptions.page

    if (total <= pageWindowSize.value) {
        return Array.from({ length: total }, (_, index) => index + 1)
    }

    const budget = Math.max(3, pageWindowSize.value - 1)
    const inner = Math.max(1, budget - 2)
    const start = Math.max(
        2,
        Math.min(current - Math.floor((inner - 1) / 2), total - inner),
    )
    const end = Math.min(total - 1, start + inner - 1)

    const items: (number | typeof ELLIPSIS)[] = [1]
    if (start > 2) items.push(ELLIPSIS)
    for (let page = start; page <= end; page++) items.push(page)
    if (end < total - 1) items.push(ELLIPSIS)
    items.push(total)
    return items
})

const updateRouteSelection = (route: RouteListItem, isSelected: boolean) =>
    updateSelection(route.id, isSelected)

const selectAll = async () => {
    try {
        await toggleAll()
    } catch (error) {
        console.error('Failed to select all routes:', error)
        notifyError(t('routes.selectAllError'))
    }
}

const toPbSortRoutes = (sortByArr: SortOption[]) =>
    toPbSort(sortByArr, '-created', {
        score: 'average_rating',
        location: 'location.name',
    })

const sortItemsMobile = computed(() => [
    {
        title: t('routes.screwed_at'),
        key: 'screw_date',
        defaultOrder: 'desc' as const,
    },
    { title: t('ratings.score'), key: 'score', defaultOrder: 'desc' as const },
    { title: t('climbing.routename'), key: 'name' },
    { title: t('climbing.difficulty'), key: 'difficulty' },
    { title: t('climbing.anchor_point'), key: 'anchor_point' },
    { title: t('climbing.location'), key: 'location' },
    { title: t('climbing.type'), key: 'type' },
])

const onMobileSortChange = (sortBy: SortOption[]) => {
    void loadRoutes({ page: 1, sortBy })
}

const loadRoutes = async (options: LoadOptions = {}) => {
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
            .getList<RouteScoreRecord>(
                tableOptions.page,
                tableOptions.itemsPerPage,
                {
                    filter: pbFilter.value || undefined,
                    sort: toPbSortRoutes(tableOptions.sortBy),
                    expand: 'location',
                    requestKey: 'adminRoutesList',
                },
            )

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
            }
        })

        routes.value = normalizedRoutes
        totalItems.value = list.totalItems
    } catch (error) {
        if (isAbortError(error)) return
        console.error('Failed to load routes:', error)
        notifyError(t('notifications.error.generic'))
    } finally {
        loading.value = false
    }
}

const onRouteSaved = async (payload?: { id?: string } | null) => {
    notify(
        t(
            payload?.id
                ? 'notifications.success.edit'
                : 'notifications.success.create',
        ),
    )
    await reloadRoutes()
}

const onRouteDeleted = async () => {
    notify(t('notifications.success.delete'))
    await reloadRoutes()
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
        notify(t('notifications.success.edit'))
        await reloadRoutes()
    } catch (error) {
        console.error('Exception in archiveSelected:', error)
        notifyError(t('notifications.error.generic'))
    }
}

const exportFormat = ref<'pdf' | 'xlsx'>('xlsx')
const showExportOptions = ref(false)
const openExportOptions = (format: 'pdf' | 'xlsx') => {
    exportFormat.value = format
    showExportOptions.value = true
}
const exportSelected = (options: ExportOptions) =>
    (exportFormat.value === 'pdf' ? exportPdf : exportXlsx)(
        selectedIds(),
        options,
    )
const exportSelectedJson = () => exportJson(selectedIds())

const mobileListRef = useTemplateRef('mobileListRef')

const onMobilePageChange = async (value: number) => {
    if (value === tableOptions.page) {
        return
    }

    await loadRoutes({ page: value })

    ;(mobileListRef.value?.$el as HTMLElement | undefined)?.scrollIntoView({
        block: 'start',
    })
}

const onMobileItemsPerPageChange = (value: number | string) => {
    const size = Number(value)
    if (!size || size === tableOptions.itemsPerPage) {
        return
    }

    clearSelection()
    void loadRoutes({ page: 1, itemsPerPage: size })
}

let filterDebounceTimer: ReturnType<typeof setTimeout> | undefined
let subscriptionDebounceTimer: ReturnType<typeof setTimeout> | undefined

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

const { data: initial } = await useAsyncData('admin-routes', async () => {
    await loadRoutes({
        page: tableOptions.page,
        itemsPerPage: tableOptions.itemsPerPage,
        sortBy: tableOptions.sortBy,
    })
    return { routes: routes.value, totalItems: totalItems.value }
})

if (initial.value) {
    routes.value = initial.value.routes
    totalItems.value = initial.value.totalItems
}

onMounted(async () => {
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
    overflow-wrap: break-word;
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
    padding-block: 6px;
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

.route-manager__mobile-pagination {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
    align-items: center;
    position: sticky;
    bottom: 0;
    z-index: 2;
    padding-block: 8px;
    padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
    background: rgb(var(--v-theme-background));
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.route-manager__page-size {
    max-width: 96px;
}

.route-manager__pager {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 2px;
}

.route-manager__page-btn {
    min-width: 32px;
    padding-inline: 0;
}

.route-manager__page-gap {
    min-width: 16px;
    text-align: center;
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.5);
}

@media (max-width: 1279.98px) {
    .route-manager__table :deep(.v-data-table__td),
    .route-manager__table :deep(.v-data-table__th) {
        padding-inline: 6px;
    }

    .route-manager__table :deep(.v-data-table__th:first-child),
    .route-manager__table :deep(.v-data-table__td:first-child) {
        width: 44px;
        min-width: 44px;
        padding-inline: 2px;
    }

    .route-manager__table :deep(table) {
        font-size: 13px;
    }
}
</style>
