<template>
    <v-container class="route-manager">
        <NewVersionAvailable />

        <v-row>
            <v-col>
                <h1>{{ $t('routes.dashboard') }}</h1>
            </v-col>
        </v-row>

        <v-row>
            <v-col cols="12" sm="6" class="d-flex flex-wrap gap-2 align-center">
                <CreateRoute @closed="reloadRoutes" />
                <ImportRoute @closed="reloadRoutes" />
            </v-col>
        </v-row>

        <v-row>
            <v-col>
                <v-row class="route-manager__filters" dense>
                    <v-col cols="12" sm="6" md="3">
                        <v-text-field
                            :id="routeNameId"
                            :label="$t('climbing.searchRouteName')"
                            v-model="searchRouteName"
                            class="mt-2"
                            density="comfortable"
                        />
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <v-select
                            :id="difficultyId"
                            :label="$t('climbing.difficulty')"
                            :items="difficulties"
                            v-model="selectedDifficulty"
                            item-title="text"
                            item-value="value"
                            class="mt-2"
                            density="comfortable"
                            clearable
                        />
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <v-select
                            :id="typeId"
                            :label="$t('climbing.type')"
                            :items="types"
                            v-model="selectedType"
                            item-title="text"
                            item-value="value"
                            class="mt-2"
                            density="comfortable"
                            clearable
                        />
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <v-select
                            :id="locationId"
                            :label="$t('climbing.location')"
                            :items="locations"
                            v-model="selectedLocation"
                            item-title="text"
                            item-value="value"
                            class="mt-2"
                            density="comfortable"
                            clearable
                        />
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <v-checkbox
                            :id="archivedCheckboxId"
                            :label="$t('filter.archived')"
                            v-model="displayArchived"
                            class="mt-2"
                            density="comfortable"
                        />
                    </v-col>
                </v-row>

                <v-row>
                    <v-col cols="12">
                        <div class="route-manager__actions">
                            <v-btn @click="selectAll" color="primary" variant="tonal">
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
                            <v-btn v-if="hasSelection" @click="printSelected" color="success" variant="tonal">
                                <v-icon start>mdi-printer</v-icon>
                                {{ $t('actions.print') }}
                            </v-btn>
                            <v-btn v-if="hasSelection" @click="exportSelectedExcel" color="success" variant="tonal">
                                <v-icon start>mdi-file-excel</v-icon>
                                XLSX
                            </v-btn>
                            <v-btn v-if="hasSelection" @click="exportSelectedJson" color="success" variant="tonal">
                                <v-icon start>mdi-code-json</v-icon>
                                JSON
                            </v-btn>
                            <v-btn v-if="hasSelection" @click="handleArchiveClick" color="warning" variant="tonal">
                                <v-icon start>mdi-archive</v-icon>
                                {{ $t('actions.archive') }}
                            </v-btn>
                            <v-btn v-if="hasSelection" @click="showDeleteConfirmation = true" color="error" variant="tonal">
                                <v-icon start>mdi-delete</v-icon>
                                {{ $t('actions.delete') }}
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
                            @update:modelValue="updateRouteSelection(item, $event)"
                        />
                    </template>
                    <template #item.color="{ item }">
                        <v-avatar :color="item.color" size="24" />
                    </template>
                    <template #item.name="{ item }">
                        <div class="route-manager__name">
                            <span class="route-manager__name-text">{{ item.name }}</span>
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
                        <div class="route-manager__comment">{{ item.comment }}</div>
                    </template>
                    <template #item.creator="{ item }">
                        <div class="route-manager__creator-chips">
                            <v-chip
                                v-for="creator in item.creator"
                                :key="creator"
                                size="small"
                                class="route-manager__creator-chip"
                            >
                                {{ creator }}
                            </v-chip>
                        </div>
                    </template>
                    <template #item.score="{ item }">
                        {{ formatScore(item) }}
                    </template>
                    <template #item.actions="{ item }">
                        <div class="route-manager__row-actions">
                            <EditRoute :route="item" @closed="reloadRoutes" />
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
                    <div v-else-if="!loading && routes.length === 0" class="route-manager__mobile-empty">
                        <v-icon size="x-large" class="mb-2">mdi-magnify-remove-outline</v-icon>
                        <p class="text-body-1 mb-0">{{ $t('table.no_data') }}</p>
                    </div>
                    <v-row v-else class="mt-2">
                        <v-col v-for="route in routes" :key="route.id" cols="12">
                            <v-card variant="outlined" class="route-manager__mobile-card">
                                <div class="route-manager__mobile-difficulty">{{ formatDifficulty(route) }}</div>
                                <div class="route-manager__mobile-header">
                                    <v-checkbox
                                        :model-value="route.selected"
                                        color="primary"
                                        hide-details
                                        density="compact"
                                        @update:modelValue="updateRouteSelection(route, $event)"
                                    />
                                    <v-avatar :color="route.color" size="32" class="mr-3" />
                                    <div class="route-manager__mobile-name">
                                        <span class="route-manager__mobile-name-text">{{ route.name }}</span>
                                        <div class="route-manager__mobile-name-meta">
                                            <v-icon
                                                v-if="route.has_ratings"
                                                color="yellow-darken-2"
                                                size="small"
                                            >
                                                mdi-star-circle
                                            </v-icon>
                                            <v-chip
                                                v-if="route.archived"
                                                size="x-small"
                                                variant="outlined"
                                                class="ml-2"
                                            >
                                                {{ $t('filter.archived') }}
                                            </v-chip>
                                        </div>
                                    </div>
                                </div>

                                <v-divider class="my-2" />

                                <v-list density="compact" class="py-0">
                                    <v-list-item :subtitle="route.comment || '—'">
                                        <template #prepend>
                                            <v-icon size="small" class="mr-3">mdi-comment-text-outline</v-icon>
                                        </template>
                                    </v-list-item>

                                    <v-list-item>
                                        <template #prepend>
                                            <v-icon size="small" class="mr-3">mdi-account-hard-hat</v-icon>
                                        </template>
                                        <div class="route-manager__mobile-creators">
                                            <v-chip v-for="creator in route.creator" :key="creator" size="x-small">
                                                {{ creator }}
                                            </v-chip>
                                        </div>
                                    </v-list-item>

                                    <v-list-item>
                                        <template #prepend>
                                            <v-icon size="small" class="mr-3">mdi-map-marker</v-icon>
                                        </template>
                                        <v-list-item-title class="text-caption text-uppercase">
                                            {{ $t('climbing.location') }}
                                        </v-list-item-title>
                                        <v-list-item-subtitle>{{ route.location || '—' }}</v-list-item-subtitle>
                                    </v-list-item>

                                    <v-list-item>
                                        <template #prepend>
                                            <v-icon size="small" class="mr-3">mdi-shape</v-icon>
                                        </template>
                                        <v-list-item-title class="text-caption text-uppercase">
                                            {{ $t('climbing.type') }}
                                        </v-list-item-title>
                                        <v-list-item-subtitle>{{ route.type || '—' }}</v-list-item-subtitle>
                                    </v-list-item>

                                    <v-list-item>
                                        <template #prepend>
                                            <v-icon size="small" class="mr-3">mdi-pound</v-icon>
                                        </template>
                                        <v-list-item-title class="text-caption text-uppercase">
                                            {{ $t('climbing.anchor_point') }}
                                        </v-list-item-title>
                                        <v-list-item-subtitle>{{ formatAnchorPoint(route.anchor_point) }}</v-list-item-subtitle>
                                    </v-list-item>

                                    <v-list-item>
                                        <template #prepend>
                                            <v-icon size="small" class="mr-3">mdi-star</v-icon>
                                        </template>
                                        <v-list-item-title class="text-caption text-uppercase">
                                            {{ $t('ratings.score') }}
                                        </v-list-item-title>
                                        <v-list-item-subtitle>{{ formatScore(route) }}</v-list-item-subtitle>
                                    </v-list-item>

                                    <v-list-item>
                                        <template #prepend>
                                            <v-icon size="small" class="mr-3">mdi-calendar-month</v-icon>
                                        </template>
                                        <v-list-item-title class="text-caption text-uppercase">
                                            {{ $t('routes.screwed_at') }}
                                        </v-list-item-title>
                                        <v-list-item-subtitle>{{ formatDate(route.screw_date) }}</v-list-item-subtitle>
                                    </v-list-item>
                                </v-list>

                                <v-card-actions class="pa-2 route-manager__mobile-actions">
                                    <v-spacer />
                                    <EditRoute :route="route" @closed="reloadRoutes" />
                                    <RouteDetails :route_id="route.id" />
                                </v-card-actions>
                            </v-card>
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

        <v-dialog v-model="showDeleteConfirmation" max-width="500px">
            <v-card>
                <v-card-text>{{ $t('notifications.deleteMoreItems') }}</v-card-text>
                <v-card-actions>
                    <v-btn color="error" @click="deleteSelected">
                        {{ $t('actions.delete') }}
                    </v-btn>
                    <v-btn color="primary" @click="showDeleteConfirmation = false">
                        {{ $t('actions.cancel') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="showArchiveConfirmation" max-width="500px">
            <v-card>
                <v-card-text>{{ $t('notifications.archiveMoreItems') }}</v-card-text>
                <v-card-actions>
                    <v-btn color="warning" @click="confirmArchive">
                        {{ $t('actions.archive') }}
                    </v-btn>
                    <v-btn color="primary" @click="showArchiveConfirmation = false">
                        {{ $t('actions.cancel') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useHead } from '#imports'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { usePocketbase } from '@/composables/pocketbase.js'
import CreateRoute from '@/components/CreateRoute.vue'
import ImportRoute from '@/components/ImportRoute.vue'
import EditRoute from '@/components/EditRoute.vue'
import RouteDetails from '@/components/RouteDetails.vue'
import NewVersionAvailable from '@/components/notifications/newVersionAvailable.vue'

const pb = usePocketbase()
const { t, locale } = useI18n()
const { smAndDown } = useDisplay()

const isMobile = computed(() => smAndDown.value)

const searchRouteName = ref('')
const selectedDifficulty = ref('')
const selectedType = ref('')
const selectedLocation = ref('')
const displayArchived = ref(false)

const showDeleteConfirmation = ref(false)
const showArchiveConfirmation = ref(false)

const routes = ref([])
const totalItems = ref(0)
const loading = ref(false)

const tableOptions = reactive({
    page: 1,
    itemsPerPage: 25,
    sortBy: [{ key: 'created', order: 'desc' }],
})

const selectedRouteIds = ref(new Set())

const createAllRouteIdsCache = () => ({
    key: null,
    ids: [],
})

const allRouteIdsCache = ref(createAllRouteIdsCache())

const pageSizeOptions = [10, 25, 50, 100]

const averageRatings = ref(new Map())
const averageRatingsLoaded = ref(false)
const averageRatingsLoading = ref(false)

const routeNameId = 'route-name-input'
const difficultyId = 'difficulty-select'
const typeId = 'type-select'
const locationId = 'location-select'
const archivedCheckboxId = 'archived-checkbox'

const difficulties = computed(() => [
    { text: t('filter.all'), value: '' },
    ...Array.from({ length: 10 }, (_, index) => ({ text: String(index + 1), value: String(index + 1) })),
])

const types = computed(() => [
    { text: t('filter.all'), value: '' },
    { text: t('routes.types.route'), value: 'Route' },
    { text: t('routes.types.boulder'), value: 'Boulder' },
])

const locations = computed(() => [
    { text: t('filter.all'), value: '' },
    { text: 'Hanau', value: 'Hanau' },
    { text: 'Gelnhausen', value: 'Gelnhausen' },
])

const tableHeaders = computed(() => [
    { title: '', key: 'selected', sortable: false, width: 56 },
    { title: t('climbing.color'), key: 'color', sortable: false },
    { title: t('climbing.routename'), key: 'name', sortable: false },
    { title: t('climbing.difficulty'), key: 'difficulty', sortable: false },
    { title: t('climbing.anchor_point'), key: 'anchor_point', sortable: false },
    { title: t('climbing.comment'), key: 'comment', sortable: false },
    { title: t('routes.route_setter'), key: 'creator', sortable: false },
    { title: t('climbing.location'), key: 'location', sortable: false },
    { title: t('climbing.type'), key: 'type', sortable: false },
    { title: t('ratings.score'), key: 'score', sortable: false },
    { title: t('table.actions'), key: 'actions', sortable: false, align: 'end' },
])

const pbFilter = computed(() => {
    const parts = []

    if (!displayArchived.value) {
        parts.push('archived = false')
    }
    if (selectedDifficulty.value) {
        parts.push(`difficulty = ${Number(selectedDifficulty.value)}`)
    }
    if (selectedType.value) {
        parts.push(`type = "${selectedType.value}"`)
    }
    if (selectedLocation.value) {
        parts.push(`location = "${selectedLocation.value}"`)
    }
    if (searchRouteName.value.trim()) {
        const term = searchRouteName.value.replace(/"/g, '\\"')
        parts.push(`name ~ "${term}"`)
    }

    return parts.join(' && ')
})

const buildSelectionCacheKey = () => JSON.stringify({
    filter: pbFilter.value || null,
})

const invalidateAllRouteIdsCache = () => {
    allRouteIdsCache.value = createAllRouteIdsCache()
}

const selectedCount = computed(() => selectedRouteIds.value.size)
const hasSelection = computed(() => selectedCount.value > 0)
const pageLength = computed(() => Math.max(1, Math.ceil(totalItems.value / tableOptions.itemsPerPage)))

const areAllSelected = () => totalItems.value > 0 && selectedCount.value >= totalItems.value

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

const toPbSort = (sortByArr) => {
    if (!Array.isArray(sortByArr) || !sortByArr.length) {
        return '-created'
    }

    return sortByArr
        .map((sort) => (sort.order === 'desc' ? `-${sort.key}` : sort.key))
        .join(',')
}

const loadAllRouteIds = async () => {
    const cacheKey = buildSelectionCacheKey()

    if (allRouteIdsCache.value.key === cacheKey && allRouteIdsCache.value.ids.length) {
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

const normalizeCreators = (raw) => {
    if (Array.isArray(raw)) {
        return raw
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter(Boolean)
    }

    if (typeof raw === 'string') {
        return raw
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
    }

    return []
}

const formatDifficulty = (route) => {
    const base = route?.difficulty ?? ''
    const sign = route?.difficulty_sign === true
        ? '+'
        : route?.difficulty_sign === false
            ? '-'
            : typeof route?.difficulty_sign === 'string'
                ? route.difficulty_sign
                : ''

    return `${base}${sign}`.trim()
}

const formatAnchorPoint = (value) => {
    if (value === null || value === undefined || value === '') {
        return '—'
    }

    if (Number(value) === 0) {
        return '-'
    }

    return value
}

const formatScore = (route) => {
    const score = typeof route?.score === 'number' && Number.isFinite(route.score)
        ? route.score
        : null

    return score !== null ? `${score.toFixed(2)}/5` : '—'
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

const loadAverageRatings = async (force = false) => {
    if (averageRatingsLoading.value) {
        return
    }

    if (averageRatingsLoaded.value && !force) {
        return
    }

    averageRatingsLoading.value = true

    try {
        const list = await pb.collection('averageRating').getFullList({ fields: 'id,average_rating' })
        averageRatings.value = new Map(
            list
                .filter((record) => Boolean(record?.id))
                .map((record) => [record.id, record.average_rating ?? null]),
        )
        averageRatingsLoaded.value = true
    } catch (error) {
        console.error('Failed to load average ratings:', error)
    } finally {
        averageRatingsLoading.value = false
    }
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
        await loadAverageRatings()
        const list = await pb.collection('routes').getList(
            tableOptions.page,
            tableOptions.itemsPerPage,
            {
                filter: pbFilter.value || undefined,
                sort: toPbSort(tableOptions.sortBy),
            },
        )

        const routeIds = list.items.map((route) => route.id)
        const averageMap = averageRatings.value

        const normalizedRoutes = list.items.map((route) => {
            const average = averageMap.get(route.id)
            const baseScore = typeof route.score === 'number' ? route.score : null
            const resolvedScore = typeof average === 'number' ? average : baseScore

            return {
                ...route,
                comment: typeof route.comment === 'string' ? route.comment : '',
                creator: normalizeCreators(route.creator),
                score: resolvedScore,
                has_ratings: typeof average === 'number' && !Number.isNaN(average),
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

    const maxPage = Math.max(1, Math.ceil(totalItems.value / tableOptions.itemsPerPage))
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

const confirmArchive = async () => {
    await archiveSelected()
}

const deleteSelected = async () => {
    const ids = Array.from(selectedRouteIds.value)
    if (!ids.length) {
        return
    }

    try {
        const batch = pb.createBatch()
        ids.forEach((id) => {
            batch.collection('routes').delete(id)
        })
        await batch.send()
        invalidateAllRouteIdsCache()
        removeSelectedIds(ids)
        showDeleteConfirmation.value = false
        await reloadRoutes()
    } catch (error) {
        console.error('Exception in deleteSelected:', error)
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

const printSelected = async () => {
    const ids = Array.from(selectedRouteIds.value)
    if (!ids.length) {
        console.warn('No routes selected for PDF export.')
        return
    }

    try {
        const response = await fetch('/api/ui/pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids }),
        })

        if (!response.ok) {
            throw new Error(`PDF export failed with status ${response.status}`)
        }

        const pdfBlob = await response.blob()
        const blob = new Blob([pdfBlob], { type: 'application/pdf' })
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.download = `${generateFilename()}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    } catch (error) {
        console.error('Error downloading PDF:', error)
    }
}

const exportSelectedExcel = async () => {
    const ids = Array.from(selectedRouteIds.value)
    if (!ids.length) {
        console.warn('No routes selected for Excel export.')
        return
    }

    try {
        const response = await fetch('/api/ui/xlsx', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids }),
        })

        if (!response.ok) {
            throw new Error(`Excel export failed with status ${response.status}`)
        }

        const excelBlob = await response.blob()
        const blob = new Blob([excelBlob], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.download = `${generateFilename()}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    } catch (error) {
        console.error('Error in exportSelectedExcel:', error)
    }
}

const exportSelectedJson = async () => {
    const ids = Array.from(selectedRouteIds.value)
    if (!ids.length) {
        console.log('No routes selected for export.')
        return
    }

    try {
        const response = await fetch('/api/ui/json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids }),
        })

        if (!response.ok) {
            throw new Error(`JSON export failed with status ${response.status}`)
        }

        const exportData = await response.json()
        const json = JSON.stringify(exportData, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${generateFilename()}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    } catch (error) {
        console.error('Error in exportSelectedJson:', error)
    }
}

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

watch(
    [searchRouteName, selectedDifficulty, selectedType, selectedLocation, displayArchived],
    () => {
        if (filterDebounceTimer) {
            clearTimeout(filterDebounceTimer)
        }

        filterDebounceTimer = setTimeout(() => {
            invalidateAllRouteIdsCache()
            clearSelection()
            tableOptions.page = 1
            void loadRoutes({
                page: 1,
                itemsPerPage: tableOptions.itemsPerPage,
                sortBy: tableOptions.sortBy,
            })
        }, 300)
    },
)

const queueReload = () => {
    clearTimeout(subscriptionDebounceTimer)
    subscriptionDebounceTimer = setTimeout(() => {
        void (async () => {
            invalidateAllRouteIdsCache()
            await loadAverageRatings(true)
            await reloadRoutes()
        })()
    }, 250)
}

onMounted(async () => {
    await loadAverageRatings()
    await loadRoutes({
        page: tableOptions.page,
        itemsPerPage: tableOptions.itemsPerPage,
        sortBy: tableOptions.sortBy,
    })

    pb.collection('routes').subscribe('*', queueReload)
    pb.collection('averageRating').subscribe('*', queueReload)
})

onBeforeUnmount(() => {
    clearTimeout(filterDebounceTimer)
    clearTimeout(subscriptionDebounceTimer)
    pb.collection('routes').unsubscribe('*')
    pb.collection('averageRating').unsubscribe('*')
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

.route-manager__filters {
    gap: 8px 0;
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

.route-manager__creator-chip {
    max-width: 120px;
    text-overflow: ellipsis;
    overflow: hidden;
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

.route-manager__mobile-card {
    position: relative;
    overflow: hidden;
}

.route-manager__mobile-difficulty {
    position: absolute;
    top: 8px;
    right: 12px;
    font-weight: 600;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

.route-manager__mobile-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 16px 8px;
}

.route-manager__mobile-name {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.route-manager__mobile-name-text {
    font-weight: 600;
    line-height: 1.25;
}

.route-manager__mobile-name-meta {
    display: flex;
    align-items: center;
    gap: 6px;
}

.route-manager__mobile-creators {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.route-manager__mobile-actions {
    justify-content: flex-end;
    gap: 8px;
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
