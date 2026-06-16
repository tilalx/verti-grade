<template>
    <v-container fluid>
        <!-- Filter Bar -->
        <FilterBar
            v-model="searchRouteName"
            :search-label="$t('climbing.searchRouteName')"
            :active-filter-count="activeFilterCount"
            @clear="clearFilters"
        >
            <template #filters>
                <v-row density="comfortable">
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
                            variant="outlined"
                            rounded="lg"
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
                            variant="outlined"
                            rounded="lg"
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
                            variant="outlined"
                            rounded="lg"
                        />
                    </v-col>
                </v-row>
            </template>
        </FilterBar>

        <!-- DESKTOP VIEW: Data Table -->
        <v-data-table-server
            v-if="mdAndUp"
            class="mt-4"
            :headers="headersDesktop"
            :items="routes"
            :items-length="totalItems"
            :loading="loading"
            :page="tableOptions.page"
            :items-per-page="tableOptions.itemsPerPage"
            :sort-by="tableOptions.sortBy"
            item-value="id"
            density="comfortable"
            @update:options="loadRoutes"
        >
            <template #item.color="{ item }">
                <v-avatar :color="item.color" size="30" />
            </template>
            <template #item.name="{ item }">
                <div class="d-flex align-center">
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
            <template #item.screw_date="{ item }">
                {{ formatDate(item.screw_date) }}
            </template>
            <template #item.actions="{ item }">
                <RouteDetails :route_id="item.id" />
            </template>
        </v-data-table-server>

        <!-- MOBILE VIEW: Card List -->
        <div v-if="smAndDown">
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
            v-if="loading && routes.length === 0 && smAndDown"
            type="card"
            class="mt-4"
            :elevation="0"
        />
        <div
            v-if="!loading && routes.length === 0 && smAndDown"
            class="text-center pa-8 mt-4"
        >
            <v-icon size="x-large" class="mb-4"
                >mdi-magnify-remove-outline</v-icon
            >
            <h3 class="text-h6">{{ $t('table.no_data') }}</h3>
        </div>
    </v-container>
</template>

<script setup lang="ts">
import type PocketBase from 'pocketbase'
import type {
    AverageRatingRecord,
    RouteListItem,
    RouteRecord,
} from '~/types/models'
import {
    formatDifficulty,
    formatAnchorPoint,
    normalizeCreators,
} from '~/utils/formatting'
import { toPbSort } from '~/utils/sorting'

const { t } = useI18n()
const pb = usePocketbase() as PocketBase
const { smAndDown, mdAndUp } = useDisplay()

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

type SortDirection = 'asc' | 'desc' | undefined
interface SortOption {
    key: string
    order?: SortDirection
}

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
const routes = ref<RouteListItem[]>([])
const totalItems = ref(0)
const sentinelRef = useTemplateRef<HTMLElement>('sentinelRef')

const headersDesktop: Array<{
    title: string
    key: string
    sortable?: boolean
}> = [
    { title: t('climbing.color'), key: 'color', sortable: false },
    { title: t('climbing.routename'), key: 'name' },
    { title: t('climbing.difficulty'), key: 'difficulty' },
    { title: t('climbing.anchor_point'), key: 'anchor_point' },
    { title: t('climbing.comment'), key: 'comment' },
    { title: t('climbing.creators'), key: 'creator' },
    { title: t('table.created_at'), key: 'screw_date' },
    { title: t('table.actions'), key: 'actions', sortable: false },
]

const pbFilter = computed(() => {
    const base = baseFilter.value
    return base ? `archived = false && ${base}` : 'archived = false'
})

const toPbSortIndex = (sortByArr: SortOption[]) =>
    toPbSort(sortByArr, '-screw_date')

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
            .collection('routes')
            .getList<RouteRecord>(
                tableOptions.page,
                tableOptions.itemsPerPage,
                {
                    filter: pbFilter.value,
                    sort,
                },
            )

        const routeIds = res.items.map((route) => route.id)
        let averageMap = new Map<string, number | null>()

        if (routeIds.length > 0) {
            try {
                const filter = routeIds.map((id) => `id = "${id}"`).join(' || ')
                const avgRecords = await pb
                    .collection('averageRating')
                    .getFullList<AverageRatingRecord>({
                        filter,
                        fields: 'id,average_rating',
                    })
                averageMap = new Map(
                    avgRecords.map((r) => [r.id, r.average_rating ?? null]),
                )
            } catch {
                // ratings are optional — don't block route display
            }
        }

        const newRoutes: RouteListItem[] = res.items.map((route) => {
            const avg = averageMap.get(route.id)
            return {
                ...route,
                creator: normalizeCreators(route.creator),
                has_ratings: typeof avg === 'number' && !Number.isNaN(avg),
                score: typeof avg === 'number' ? avg : undefined,
            }
        })

        if (meta.append) {
            routes.value = routes.value.concat(newRoutes)
        } else {
            routes.value = newRoutes
        }

        totalItems.value = res.totalItems
    } catch (error) {
        console.error('Failed to load routes:', error)
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

onMounted(async () => {
    await Promise.all([
        loadRoutes({ ...tableOptions }),
        subscribe('routes', () => {
            tableOptions.page = 1
            void loadRoutes({}, { append: false })
        }),
    ])
    setupScrollObserver()
})

onBeforeUnmount(() => {
    if (debounceT) {
        clearTimeout(debounceT)
        debounceT = null
    }
    scrollObserver?.disconnect()
})

function formatDate(date: string | null | undefined) {
    if (!date) return ''
    return new Date(date).toLocaleDateString()
}
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
}
</style>
