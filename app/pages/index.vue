<template>
    <v-container>
        <LayoutPageHeader :title="$t('page.content.index')" />

        <!-- Filter Bar -->
        <FilterBar
            v-model="searchRouteName"
            :search-label="$t('climbing.searchRouteName')"
            :active-filter-count="activeFilterCount"
            @clear="clearFilters"
        >
            <template #filters>
                <v-row density="comfortable">
                    <v-col v-if="!isWideLayout" cols="12" sm="4">
                        <RouteSortControl
                            :model-value="tableOptions.sortBy"
                            :items="sortItemsMobile"
                            @update:modelValue="onMobileSortChange"
                        />
                    </v-col>
                    <v-col cols="12" sm="4">
                        <v-select
                            :label="$t('climbing.difficulty')"
                            :items="difficulties"
                            v-model="selectedDifficulty"
                            item-title="text"
                            item-value="value"
                            clearable
                            hide-details
                            density="compact"
                            data-testid="index-filter-difficulty"
                        />
                    </v-col>
                    <v-col cols="12" sm="4">
                        <v-select
                            :label="$t('climbing.type')"
                            :items="types"
                            v-model="selectedType"
                            item-title="text"
                            item-value="value"
                            clearable
                            hide-details
                            density="compact"
                            data-testid="index-filter-type"
                        />
                    </v-col>
                    <v-col cols="12" sm="4">
                        <v-select
                            :label="$t('climbing.location')"
                            :items="locations"
                            v-model="selectedLocation"
                            item-title="text"
                            item-value="value"
                            clearable
                            hide-details
                            density="compact"
                            data-testid="index-filter-location"
                        />
                    </v-col>
                </v-row>
            </template>
        </FilterBar>

        <!-- DESKTOP VIEW: Data Table -->
        <div v-if="isWideLayout" data-testid="index-table">
            <v-data-table-server
                class="mt-4"
                :headers="headersDesktop"
                :items="routes"
                :items-length="totalItems"
                :loading="loading"
                :page="tableOptions.page"
                :items-per-page="tableOptions.itemsPerPage"
                :sort-by="tableOptions.sortBy"
                no-data-text="table.no_data"
                item-value="id"
                @update:options="loadRoutes"
            >
                <template #item.color="{ item }">
                    <v-avatar :color="item.color" size="30" />
                </template>
                <template #item.name="{ item }">
                    <div
                        class="d-flex align-center"
                        :data-testid="`index-row-${item.id}`"
                    >
                        <span class="route-name">{{ item.name }}</span>
                        <v-icon
                            v-if="item.has_ratings"
                            color="yellow-darken-2"
                            size="small"
                            class="ml-2"
                            >mdi-star-circle</v-icon
                        >
                    </div>
                </template>
                <template #item.difficulty="{ item }">
                    <span>{{ formatDifficulty(item) }}</span>
                </template>
                <template #item.anchor_point="{ item }">
                    <span>{{ formatAnchorPoint(item.anchor_point) }}</span>
                </template>
                <template #item.comment="{ item }">
                    <div class="route-comment">{{ item.comment }}</div>
                </template>
                <template #item.creator="{ item }">
                    <div class="creator-chips">
                        <v-chip
                            v-for="c in item.creator"
                            :key="c"
                            size="small"
                            class="ma-0"
                            >{{ c }}</v-chip
                        >
                    </div>
                </template>
                <template #item.score="{ item }">
                    {{ formatScore(item) }}
                </template>
                <template #item.screw_date="{ item }">
                    {{ formatDate(item.screw_date, { locale }) }}
                </template>
                <template #item.actions="{ item }">
                    <RouteDetails :route_id="item.id" />
                </template>
            </v-data-table-server>
        </div>

        <!-- MOBILE VIEW: Card List -->
        <div v-if="!isWideLayout">
            <v-row class="mt-2">
                <v-col v-for="route in routes" :key="route.id" cols="12">
                    <RouteCard :route="route">
                        <template #actions>
                            <RouteDetails :route_id="route.id" />
                        </template>
                    </RouteCard>
                </v-col>
            </v-row>

            <!-- Infinite scroll sentinel -->
            <div ref="sentinelRef" class="pa-4 text-center">
                <v-progress-circular
                    v-if="loading && routes.length > 0"
                    indeterminate
                    size="24"
                    width="2"
                    color="primary"
                />
            </div>
        </div>

        <!-- Empty State / Skeleton Loader on Mobile -->
        <v-skeleton-loader
            v-if="loading && routes.length === 0 && !isWideLayout"
            type="card"
            class="mt-4"
            :elevation="0"
        />
        <LayoutEmptyState
            v-if="!loading && routes.length === 0 && !isWideLayout"
            class="mt-4"
            :title="$t('table.no_data')"
        />
    </v-container>
</template>

<script setup lang="ts">
import type PocketBase from 'pocketbase'
import type { RouteListItem, RouteScoreRecord } from '~/types/models'
import {
    formatDifficulty,
    formatAnchorPoint,
    formatScore,
    normalizeCreators,
    formatDate,
} from '#shared/utils/formatting'
import { toPbSort, type SortOption } from '~/utils/sorting'

const { t, locale } = useI18n()
const pb = usePocketbase() as PocketBase
const { lgAndUp } = useDisplay()

const isWideLayout = computed(() => lgAndUp.value)
const { error: notifyError } = useNotification()

const {
    searchRouteName,
    selectedDifficulty,
    selectedType,
    selectedLocation,
    difficulties,
    types,
    locations,
    activeFilterCount,
    pbFilter: baseFilter,
    clearFilters,
} = useRouteFilters()

useHead({
    title: t('page.title.index'),
    meta: [
        {
            name: 'description',
            content: t('page.content.index'),
            authRequired: false,
        },
    ],
})

interface TableOptions {
    page: number
    itemsPerPage: number
    sortBy: SortOption[]
}

const tableOptions = reactive<TableOptions>({
    page: 1,
    itemsPerPage: 20,
    sortBy: [{ key: 'screw_date', order: 'desc' }],
})

const loading = ref(true)
const routes = shallowRef<RouteListItem[]>([])
const totalItems = ref(0)
const sentinelRef = useTemplateRef<HTMLElement>('sentinelRef')

const headersDesktop = computed<
    Array<{ title: string; key: string; sortable?: boolean }>
>(() => [
    { title: t('climbing.color'), key: 'color', sortable: false },
    { title: t('climbing.routename'), key: 'name' },
    { title: t('climbing.difficulty'), key: 'difficulty' },
    { title: t('climbing.anchor_point'), key: 'anchor_point' },
    { title: t('climbing.comment'), key: 'comment' },
    { title: t('climbing.creators'), key: 'creator' },
    { title: t('ratings.score'), key: 'score' },
    { title: t('table.created_at'), key: 'screw_date' },
    { title: t('table.actions'), key: 'actions', sortable: false },
])

const pbFilter = computed(() => {
    const base = baseFilter.value
    return base ? `archived = false && ${base}` : 'archived = false'
})

const sortItemsMobile = computed(() => [
    {
        title: t('table.created_at'),
        key: 'screw_date',
        defaultOrder: 'desc' as const,
    },
    {
        title: t('ratings.score'),
        key: 'score',
        defaultOrder: 'desc' as const,
    },
    { title: t('climbing.routename'), key: 'name' },
    { title: t('climbing.difficulty'), key: 'difficulty' },
    { title: t('climbing.anchor_point'), key: 'anchor_point' },
])

function onMobileSortChange(sortBy: SortOption[]) {
    tableOptions.sortBy = sortBy
    tableOptions.page = 1
    void loadRoutes({}, { append: false })
}

const toPbSortIndex = (sortByArr: SortOption[]) =>
    toPbSort(sortByArr, '-screw_date', { score: 'average_rating' })

async function loadRoutes(
    options: Partial<TableOptions> = {},
    meta: { append?: boolean } = {},
): Promise<void> {
    loading.value = true

    if (typeof options.page === 'number') tableOptions.page = options.page
    if (typeof options.itemsPerPage === 'number')
        tableOptions.itemsPerPage = options.itemsPerPage
    if (options.sortBy) tableOptions.sortBy = options.sortBy

    const sort = toPbSortIndex(tableOptions.sortBy)

    try {
        const res = await pb
            .collection('averageRating')
            .getList<RouteScoreRecord>(
                tableOptions.page,
                tableOptions.itemsPerPage,
                {
                    filter: pbFilter.value,
                    sort,
                    expand: 'location',
                },
            )

        const newRoutes: RouteListItem[] = res.items.map((route) => {
            const hasRatings =
                Number(route.ratings_count ?? 0) > 0 &&
                typeof route.average_rating === 'number'
            return {
                ...route,
                creator: normalizeCreators(route.creator),
                has_ratings: hasRatings,
                score: hasRatings ? route.average_rating : undefined,
            }
        })

        if (meta.append) {
            routes.value = routes.value.concat(newRoutes)
        } else {
            routes.value = newRoutes
        }

        totalItems.value = res.totalItems
    } catch (error) {
        if (error?.isAbort) return
        console.error('Failed to load routes:', error)
        notifyError(t('notifications.error.generic'))
    } finally {
        loading.value = false
    }
}

function loadMore() {
    if (loading.value || routes.value.length >= totalItems.value) return
    tableOptions.page += 1
    void loadRoutes({}, { append: true })
}

let scrollObserver: IntersectionObserver | null = null

function setupScrollObserver() {
    if (!sentinelRef.value) return
    scrollObserver = new IntersectionObserver(
        (entries) => {
            if (entries[0]?.isIntersecting) loadMore()
        },
        { rootMargin: '200px' },
    )
    scrollObserver.observe(sentinelRef.value)
}

let debounceT: ReturnType<typeof setTimeout> | null = null
watch(pbFilter, () => {
    if (debounceT) {
        clearTimeout(debounceT)
    }

    debounceT = setTimeout(() => {
        tableOptions.page = 1
        void loadRoutes({}, { append: false })
    }, 300)
})

const { subscribe } = usePbSubscription()

const { data: initial } = await useAsyncData('index-routes', async () => {
    await loadRoutes({ ...tableOptions })
    return { routes: routes.value, totalItems: totalItems.value }
})

if (initial.value) {
    routes.value = initial.value.routes
    totalItems.value = initial.value.totalItems
}
loading.value = false

onMounted(async () => {
    await subscribe('routes', () => {
        tableOptions.page = 1
        void loadRoutes({}, { append: false })
    })
    setupScrollObserver()
})

onBeforeUnmount(() => {
    if (debounceT) {
        clearTimeout(debounceT)
        debounceT = null
    }
    scrollObserver?.disconnect()
})
</script>

<style scoped>
.route-name {
    max-width: 260px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.route-comment {
    min-width: 200px;
    max-width: 420px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.creator-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding-block: 6px;
}

@media (max-width: 1279.98px) {
    :deep(.v-data-table__td),
    :deep(.v-data-table__th) {
        padding-inline: 6px;
    }

    :deep(table) {
        font-size: 13px;
    }

    .route-comment {
        min-width: 0;
    }
}
</style>
