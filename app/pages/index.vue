<template>
    <v-app>
        <v-main>
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
                        <v-col
                            v-for="route in routes"
                            :key="route.id"
                            cols="12"
                        >
                            <v-card
                                variant="outlined"
                                class="mobile-route-card"
                            >
                                <div
                                    class="route-difficulty-display text-h5 font-weight-bold"
                                >
                                    {{ formatDifficulty(route) }}
                                </div>
                                <v-list-item class="pt-3 pb-2 pr-12">
                                    <template #prepend>
                                        <v-avatar
                                            :color="route.color"
                                            size="32"
                                            class="mr-4"
                                        />
                                    </template>
                                    <v-list-item-title
                                        class="text-h6 font-weight-bold d-flex align-center"
                                    >
                                        {{ route.name }}
                                        <v-icon
                                            v-if="route.has_ratings"
                                            color="yellow-darken-2"
                                            size="small"
                                            class="ml-2"
                                            >mdi-star-circle</v-icon
                                        >
                                    </v-list-item-title>
                                </v-list-item>
                                <v-divider />
                                <v-list density="compact" class="py-1">
                                    <v-list-item
                                        :subtitle="route.comment || '—'"
                                    >
                                        <template #prepend
                                            ><v-icon size="small" class="mr-3"
                                                >mdi-comment-text-outline</v-icon
                                            ></template
                                        >
                                    </v-list-item>
                                    <v-list-item>
                                        <template #prepend
                                            ><v-icon size="small" class="mr-3"
                                                >mdi-account-hard-hat</v-icon
                                            ></template
                                        >
                                        <div class="d-flex ga-1 flex-wrap mt-1">
                                            <v-chip
                                                v-for="c in route.creator"
                                                :key="c"
                                                size="x-small"
                                                >{{ c }}</v-chip
                                            >
                                        </div>
                                    </v-list-item>
                                    <v-list-item>
                                        <template #prepend
                                            ><v-icon size="small" class="mr-3"
                                                >mdi-pound</v-icon
                                            ></template
                                        >
                                        <v-list-item-title
                                            class="text-caption text-uppercase"
                                            >{{
                                                $t('climbing.anchor_point')
                                            }}</v-list-item-title
                                        >
                                        <v-list-item-subtitle>{{
                                            formatAnchorPoint(
                                                route.anchor_point,
                                            )
                                        }}</v-list-item-subtitle>
                                    </v-list-item>
                                    <v-list-item
                                        :subtitle="
                                            formatDate(route.screw_date) || '—'
                                        "
                                    >
                                        <template #prepend
                                            ><v-icon size="small" class="mr-3"
                                                >mdi-calendar-month</v-icon
                                            ></template
                                        >
                                    </v-list-item>
                                </v-list>
                                <v-card-actions class="pa-2">
                                    <v-spacer />
                                    <RouteDetails :route_id="route.id" />
                                </v-card-actions>
                            </v-card>
                        </v-col>
                    </v-row>

                    <!-- "Load More" Button for Mobile -->
                    <div
                        v-if="routes.length < totalItems"
                        class="text-center pa-4"
                    >
                        <v-btn
                            :loading="loading"
                            @click="loadMore"
                            variant="tonal"
                            color="primary"
                        >
                            {{ $t('actions.load_more') }}
                        </v-btn>
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
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import type PocketBase from 'pocketbase'
import type { RatingRecord, RouteListItem, RouteRecord } from '~/types/models'
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
        let ratedRouteIds = new Set<string>()

        if (routeIds.length > 0) {
            const ratingsFilter = routeIds
                .map((id) => `route_id = "${id}"`)
                .join(' || ')
            const ratingsRecords = await pb
                .collection('ratings')
                .getFullList<RatingRecord>({
                    filter: ratingsFilter,
                    fields: 'route_id',
                })

            const ids = ratingsRecords
                .map((rating) => rating.route_id)
                .filter(
                    (routeId): routeId is string =>
                        typeof routeId === 'string' && routeId.length > 0,
                )
            ratedRouteIds = new Set(ids)
        }

        const newRoutes: RouteListItem[] = res.items.map((route) => ({
            ...route,
            creator: normalizeCreators(route.creator),
            has_ratings: ratedRouteIds.has(route.id),
        }))

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
    tableOptions.page += 1
    void loadRoutes({}, { append: true })
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
})

onBeforeUnmount(() => {
    if (debounceT) {
        clearTimeout(debounceT)
        debounceT = null
    }
})

function formatDate(date: string | null | undefined) {
    if (!date) return ''
    return new Date(date).toLocaleDateString('de-DE')
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
    max-height: 40px;
    overflow: hidden;
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
}
.mobile-route-card {
    position: relative;
    overflow: hidden;
}
.route-difficulty-display {
    position: absolute;
    top: 8px;
    right: 12px;
    z-index: 1;
    color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
