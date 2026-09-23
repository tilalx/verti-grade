<template>
    <v-container class="comments-page">
        <LayoutPageHeader :title="t('routes.comments')" />

        <div class="stats-scroll mb-3">
            <div class="stats-scroll__inner">
                <v-card
                    border
                    flat
                    class="stat-chip pa-2 px-3 text-center"
                    data-testid="comments-stat-total"
                >
                    <div class="text-title-large font-weight-bold text-primary">
                        {{ stats.totalReviews }}
                    </div>
                    <div class="text-body-small text-medium-emphasis">
                        {{ t('comments.totalReviews') }}
                    </div>
                </v-card>
                <v-card
                    border
                    flat
                    class="stat-chip pa-2 px-3 text-center"
                    data-testid="comments-stat-avg-rating"
                >
                    <div class="d-flex align-center justify-center ga-1">
                        <span
                            class="text-title-large font-weight-bold text-warning"
                            >{{ stats.avgRating }}</span
                        >
                        <v-icon color="yellow-darken-2" size="16"
                            >mdi-star</v-icon
                        >
                    </div>
                    <div class="text-body-small text-medium-emphasis">
                        {{ t('comments.avgRating') }}
                    </div>
                </v-card>
                <v-card
                    border
                    flat
                    class="stat-chip pa-2 px-3 text-center"
                    data-testid="comments-stat-this-week"
                >
                    <div class="text-title-large font-weight-bold text-success">
                        {{ stats.thisWeek }}
                    </div>
                    <div class="text-body-small text-medium-emphasis">
                        {{ t('comments.thisWeek') }}
                    </div>
                </v-card>
                <v-card
                    border
                    flat
                    class="stat-chip pa-2 px-3 text-center"
                    data-testid="comments-stat-low-rated"
                >
                    <div class="text-title-large font-weight-bold text-error">
                        {{ stats.lowRated }}
                    </div>
                    <div class="text-body-small text-medium-emphasis">
                        {{ t('comments.lowRated') }}
                    </div>
                </v-card>
            </div>
        </div>

        <!-- ── Filter bar ────────────────────────────────────────────────── -->
        <FilterBar
            v-model="search"
            :search-label="t('actions.search')"
            :active-filter-count="activeFilterCount"
            @clear="clearFilters"
        >
            <template #filters>
                <v-row density="comfortable" align="center">
                    <v-col cols="6" sm="4" md="3">
                        <v-select
                            v-model="selectedLocation"
                            :label="t('climbing.location')"
                            :items="locations"
                            item-title="text"
                            item-value="value"
                            clearable
                            hide-details
                            density="compact"
                            data-testid="comments-filter-location"
                        />
                    </v-col>
                    <v-col cols="6" sm="3" md="2">
                        <v-select
                            v-model="selectedDifficulty"
                            :label="t('climbing.difficulty')"
                            :items="difficulties"
                            item-title="text"
                            item-value="value"
                            clearable
                            hide-details
                            density="compact"
                            data-testid="comments-filter-difficulty"
                        />
                    </v-col>
                    <v-col cols="12" sm="5" md="3">
                        <v-select
                            v-model="sortOrder"
                            :items="sortOptions"
                            item-title="label"
                            item-value="value"
                            hide-details
                            density="compact"
                            prepend-inner-icon="mdi-sort"
                            data-testid="comments-sort"
                        />
                    </v-col>
                </v-row>

                <v-row density="comfortable" align="center" class="mt-2">
                    <v-col cols="12" sm="auto">
                        <v-chip-group
                            v-model="selectedRating"
                            color="warning"
                            column
                            mandatory
                        >
                            <v-chip
                                filter
                                :value="0"
                                size="small"
                                variant="tonal"
                                data-testid="comments-filter-rating-all"
                            >
                                {{ t('filter.all') }}
                            </v-chip>
                            <v-chip
                                v-for="star in [1, 2, 3, 4, 5]"
                                :key="star"
                                filter
                                :value="star"
                                size="small"
                                color="warning"
                                variant="tonal"
                                :data-testid="`comments-filter-rating-${star}`"
                            >
                                {{ star }}★
                            </v-chip>
                        </v-chip-group>
                    </v-col>
                    <v-col cols="12" sm="auto">
                        <v-btn-toggle
                            v-model="dateFilter"
                            density="compact"
                            mandatory
                            rounded="lg"
                            divided
                            variant="outlined"
                            data-testid="comments-filter-date"
                        >
                            <v-btn value="" size="small">{{
                                t('filter.all')
                            }}</v-btn>
                            <v-btn value="week" size="small">{{
                                t('comments.thisWeek')
                            }}</v-btn>
                            <v-btn value="month" size="small">{{
                                t('comments.thisMonth')
                            }}</v-btn>
                        </v-btn-toggle>
                    </v-col>
                </v-row>
            </template>

            <template #below>
                <v-slide-y-transition>
                    <div
                        v-if="selectedCount > 0"
                        class="bulk-bar px-4 py-2 d-flex align-center ga-2 flex-wrap"
                    >
                        <v-icon size="18" color="primary"
                            >mdi-check-circle-outline</v-icon
                        >
                        <span class="text-body-medium font-weight-medium">
                            {{ t('comments.selected', { n: selectedCount }) }}
                        </span>
                        <v-spacer />
                        <v-btn
                            size="small"
                            variant="text"
                            data-testid="comments-bulk-cancel"
                            @click="clearSelection"
                        >
                            {{ t('actions.cancel') }}
                        </v-btn>
                        <v-btn
                            size="small"
                            color="error"
                            variant="tonal"
                            prepend-icon="mdi-delete-outline"
                            data-testid="comments-bulk-delete"
                            @click="bulkDeleteDialog = true"
                        >
                            {{
                                t('comments.deleteSelected', {
                                    n: selectedCount,
                                })
                            }}
                        </v-btn>
                    </div>
                </v-slide-y-transition>
            </template>
        </FilterBar>

        <!-- ── Loading skeletons ───────────────────────────────────────────── -->
        <v-row v-if="loading && !comments.length">
            <v-col v-for="i in 6" :key="i" cols="12" sm="6" lg="4">
                <v-skeleton-loader type="card-avatar" rounded="lg" />
            </v-col>
        </v-row>

        <!-- ── Empty state ─────────────────────────────────────────────────── -->
        <LayoutEmptyState
            v-else-if="!loading && !comments.length"
            icon="mdi-comment-off-outline"
            :title="t('comments.noComments')"
            :hint="t('comments.noCommentsHint')"
        />

        <!-- ── Comment Cards ───────────────────────────────────────────────── -->
        <v-row v-else>
            <v-col
                v-for="comment in comments"
                :key="comment.id"
                cols="12"
                sm="6"
                lg="4"
            >
                <VirtualWindow :estimated-height="240">
                    <CommentsCard
                        :comment="comment"
                        selectable
                        :selected="!!selectedMap[comment.id]"
                        show-route
                        @toggle-select="toggleSelect(comment.id)"
                    >
                        <template #actions>
                            <v-btn
                                icon
                                size="small"
                                variant="text"
                                :aria-label="t('actions.edit')"
                                data-testid="comment-card-edit"
                                @click="openEdit(comment)"
                            >
                                <v-icon size="18">mdi-pencil-outline</v-icon>
                                <v-tooltip activator="parent" location="top">{{
                                    t('actions.edit')
                                }}</v-tooltip>
                            </v-btn>
                            <v-btn
                                icon="mdi-delete-outline"
                                color="error"
                                size="small"
                                variant="text"
                                :aria-label="t('actions.delete')"
                                data-testid="comment-card-delete"
                                @click="openDelete(comment)"
                            />
                        </template>
                    </CommentsCard>
                </VirtualWindow>
            </v-col>
        </v-row>

        <!-- Result count + infinite-scroll sentinel -->
        <div v-if="!loading && comments.length" class="text-center mt-4">
            <p class="text-body-small text-medium-emphasis mb-3">
                {{
                    t('comments.showing', {
                        n: comments.length,
                        total: totalItems,
                    })
                }}
            </p>
            <div ref="sentinelRef" class="load-sentinel">
                <v-progress-circular
                    v-if="loadingMore"
                    indeterminate
                    size="24"
                    width="2"
                    color="primary"
                />
            </div>
        </div>

        <!-- ── Edit Dialog (shared ReviewFormDialog component) ────────────── -->
        <ReviewFormDialog
            v-model="editDialog"
            :review="editingReview"
            @saved="onReviewSaved"
        />

        <!-- ── Single Delete Dialog (shared across all cards) ──────────────── -->
        <ConfirmDialog
            v-model="deleteDialog"
            :title="t('actions.confirm')"
            :message="t('notifications.deleteItem')"
            :loading="deleting"
            @confirm="confirmDelete"
        />

        <!-- ── Bulk Delete Dialog ───────────────────────────────────────────── -->
        <ConfirmDialog
            v-model="bulkDeleteDialog"
            :title="t('comments.bulkDeleteTitle', { n: selectedCount })"
            :message="t('notifications.deleteMoreItems')"
            :loading="bulkDeleting"
            @confirm="bulkDelete"
        />
    </v-container>
</template>

<script setup>
import { formatDifficulty } from '~/utils/formatting'

const { t } = useI18n()
const pb = usePocketbase()

useHead({
    title: t('page.title.comments'),
    meta: [{ name: 'description', content: t('page.content.comments') }],
})

definePageMeta({
    middleware: ['auth'],
    requiredPermission: 'manage_comments',
})

// ── State ──────────────────────────────────────────────────────────────────

const loading = ref(true)
const loadingMore = ref(false)
const bulkDeleting = ref(false)

const comments = ref([])
const stats = ref({ totalReviews: 0, avgRating: '—', thisWeek: 0, lowRated: 0 })

const page = ref(1)
const PER_PAGE = 48
const totalItems = ref(0)
const hasMore = computed(() => comments.value.length < totalItems.value)

const search = ref('')
const selectedLocation = ref(null)
const selectedDifficulty = ref(null)
const selectedRating = ref(0)
const dateFilter = ref('')
const sortOrder = ref('newest')

const selectedMap = reactive({})
const selectedCount = computed(() => Object.keys(selectedMap).length)

const editDialog = ref(false)
const editingReview = ref(null)

const bulkDeleteDialog = ref(false)

const { notify, error: notifyError } = useNotification()

const activeFilterCount = computed(
    () =>
        [selectedLocation.value, selectedDifficulty.value].filter(Boolean)
            .length +
        (selectedRating.value !== 0 ? 1 : 0) +
        (dateFilter.value ? 1 : 0),
)

function clearFilters() {
    selectedLocation.value = null
    selectedDifficulty.value = null
    selectedRating.value = 0
    dateFilter.value = ''
    sortOrder.value = 'newest'
}

// ── Static options ─────────────────────────────────────────────────────────

const difficulties = computed(() => [
    { text: t('filter.all'), value: null },
    ...Array.from({ length: 10 }, (_, i) => ({
        text: String(i + 1),
        value: i + 1,
    })),
])

const { data: locationRecords } = useLocations()

const locations = computed(() => [
    { text: t('filter.all'), value: null },
    ...locationRecords.value.map((location) => ({
        text: location.name,
        value: location.id,
    })),
])

const sortOptions = computed(() => [
    { label: t('comments.sortNewest'), value: 'newest' },
    { label: t('comments.sortOldest'), value: 'oldest' },
    { label: t('comments.sortHighest'), value: 'highest' },
    { label: t('comments.sortLowest'), value: 'lowest' },
])

// ── Query builders ─────────────────────────────────────────────────────────

function buildFilter(searchTerm) {
    const parts = []
    if (selectedRating.value !== 0)
        parts.push(`rating = ${selectedRating.value}`)
    if (selectedLocation.value)
        parts.push(`route_id.location = "${selectedLocation.value}"`)
    if (selectedDifficulty.value !== null)
        parts.push(`difficulty = ${selectedDifficulty.value}`)
    if (dateFilter.value === 'week') {
        const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        parts.push(`created >= "${d}"`)
    } else if (dateFilter.value === 'month') {
        const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        parts.push(`created >= "${d}"`)
    }
    if (searchTerm) {
        const s = searchTerm.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
        parts.push(`(comment ~ "${s}" || route_id.name ~ "${s}")`)
    }
    return parts.join(' && ')
}

function buildSort() {
    switch (sortOrder.value) {
        case 'oldest':
            return '+created'
        case 'highest':
            return '-rating'
        case 'lowest':
            return '+rating'
        default:
            return '-created'
    }
}

// ── Data fetching ──────────────────────────────────────────────────────────

const LIST_FIELDS = [
    '*',
    'expand.route_id.id',
    'expand.route_id.name',
    'expand.route_id.expand.location.name',
    'expand.user.id',
    'expand.user.collectionId',
    'expand.user.name',
    'expand.user.username',
    'expand.user.avatar',
].join(',')

function mapComment(c) {
    return {
        ...c,
        routeId: c.expand?.route_id?.id ?? null,
        routeName: c.expand?.route_id?.name ?? 'N/A',
        location: locationName(c.expand?.route_id) || null,
        difficultyLabel: c.difficulty != null ? formatDifficulty(c) : null,
        userName:
            c.expand?.user?.name ||
            c.expand?.user?.username ||
            t('comments.anonymous'),
        userAvatar:
            usePbFileUrl(c.expand?.user, c.expand?.user?.avatar, {
                thumb: '100x100',
            }) || null,
    }
}

const fetchStats = async () => {
    try {
        const result = await pb.collection('ratingsStats').getList(1, 1, {
            skipTotal: true,
            requestKey: 'commentsStats',
        })
        const rec = result.items[0]
        if (!rec) return
        stats.value = {
            totalReviews: Number(rec.totalReviews) || 0,
            avgRating:
                rec.avgRating != null ? Number(rec.avgRating).toFixed(1) : '—',
            thisWeek: Number(rec.thisWeek) || 0,
            lowRated: Number(rec.lowRated) || 0,
        }
    } catch (err) {
        if (err?.isAbort) return
    }
}

let statsDebounce = null
function scheduleStatsRefresh() {
    clearTimeout(statsDebounce)
    statsDebounce = setTimeout(() => fetchStats(), 500)
}

const fetchList = async (append = false) => {
    if (append) {
        loadingMore.value = true
    } else {
        loading.value = true
        page.value = 1
        comments.value = []
    }

    try {
        const result = await pb
            .collection('ratings')
            .getList(page.value, PER_PAGE, {
                sort: buildSort(),
                filter: buildFilter(search.value.trim()),
                expand: 'route_id.location,user',
                fields: LIST_FIELDS,
                requestKey: 'commentsList',
            })
        totalItems.value = result.totalItems
        const mapped = result.items.map(mapComment)
        comments.value = append ? [...comments.value, ...mapped] : mapped
    } catch (err) {
        if (err?.isAbort) return
        console.error('Failed to fetch comments:', err)
        notifyError(t('notifications.error.generic'))
    } finally {
        loading.value = false
        loadingMore.value = false
    }
}

async function loadMore() {
    page.value++
    await fetchList(true)
    await nextTick()
    if (sentinelRef.value && scrollObserver) {
        scrollObserver.unobserve(sentinelRef.value)
        scrollObserver.observe(sentinelRef.value)
    }
}

// ── Infinite scroll ────────────────────────────────────────────────────────

const sentinelRef = ref(null)
let scrollObserver = null

function maybeLoadMore() {
    if (loading.value || loadingMore.value || !hasMore.value) return
    loadMore()
}

watch(sentinelRef, (el) => {
    scrollObserver?.disconnect()
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (!scrollObserver) {
        scrollObserver = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) maybeLoadMore()
            },
            { rootMargin: '400px 0px' },
        )
    }
    scrollObserver.observe(el)
})

// ── Watchers ───────────────────────────────────────────────────────────────

let searchDebounce = null
watch(search, () => {
    clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => fetchList(), 300)
})

watch(
    [
        selectedLocation,
        selectedDifficulty,
        selectedRating,
        dateFilter,
        sortOrder,
    ],
    () => fetchList(),
)

// ── Edit ───────────────────────────────────────────────────────────────────

function openEdit(comment) {
    editingReview.value = comment
    editDialog.value = true
}

function onReviewSaved(updated) {
    const idx = comments.value.findIndex((c) => c.id === updated.id)
    if (idx !== -1) {
        comments.value[idx] = mapComment({
            ...updated,
            expand: comments.value[idx].expand,
        })
    }
    notify(t('notifications.success.edit'))
    scheduleStatsRefresh()
}

// ── Single delete (one shared ConfirmDialog for all cards) ─────────────────

const deleteDialog = ref(false)
const deleting = ref(false)
const deleteTarget = ref(null)

function openDelete(comment) {
    deleteTarget.value = comment
    deleteDialog.value = true
}

async function confirmDelete() {
    if (!deleteTarget.value) return
    deleting.value = true
    try {
        const id = deleteTarget.value.id
        await pb.collection('ratings').delete(id)
        comments.value = comments.value.filter((c) => c.id !== id)
        totalItems.value = Math.max(0, totalItems.value - 1)
        deleteDialog.value = false
        deleteTarget.value = null
        notify(t('notifications.success.delete'))
        scheduleStatsRefresh()
    } catch (err) {
        console.error('Error deleting comment:', err)
        notifyError(t('notifications.error.generic'))
    } finally {
        deleting.value = false
    }
}

// ── Bulk delete ────────────────────────────────────────────────────────────

async function bulkDelete() {
    bulkDeleting.value = true
    try {
        const ids = Object.keys(selectedMap)
        const batch = pb.createBatch()
        ids.forEach((id) => batch.collection('ratings').delete(id))
        await batch.send()
        comments.value = comments.value.filter((c) => !ids.includes(c.id))
        totalItems.value = Math.max(0, totalItems.value - ids.length)
        notify(t('notifications.success.delete'))
        clearSelection()
        bulkDeleteDialog.value = false
        scheduleStatsRefresh()
    } catch (err) {
        console.error('Error bulk deleting:', err)
        notifyError(t('notifications.error.generic'))
    } finally {
        bulkDeleting.value = false
    }
}

// ── Selection helpers ──────────────────────────────────────────────────────

function toggleSelect(id) {
    if (selectedMap[id]) delete selectedMap[id]
    else selectedMap[id] = true
}

function clearSelection() {
    Object.keys(selectedMap).forEach((k) => delete selectedMap[k])
}

// ── Lifecycle ──────────────────────────────────────────────────────────────

const { subscribe } = usePbSubscription()

const { data: initial } = await useAsyncData('admin-comments', async () => {
    await Promise.all([fetchList(), fetchStats()])
    return {
        comments: comments.value,
        totalItems: totalItems.value,
        stats: stats.value,
    }
})

if (initial.value) {
    comments.value = initial.value.comments
    totalItems.value = initial.value.totalItems
    stats.value = initial.value.stats
}
loading.value = false

onMounted(async () => {
    await subscribe('ratings', async (e) => {
        if (e.action === 'delete') {
            comments.value = comments.value.filter((c) => c.id !== e.record.id)
            totalItems.value = Math.max(0, totalItems.value - 1)
            scheduleStatsRefresh()
        } else if (e.action === 'create') {
            totalItems.value++
            if (sortOrder.value === 'newest' && !hasMore.value) {
                try {
                    const rec = await pb
                        .collection('ratings')
                        .getOne(e.record.id, {
                            expand: 'route_id.location,user',
                            fields: LIST_FIELDS,
                            requestKey: null,
                        })
                    comments.value = [mapComment(rec), ...comments.value]
                } catch {}
            }
            scheduleStatsRefresh()
        } else if (e.action === 'update') {
            const idx = comments.value.findIndex((c) => c.id === e.record.id)
            if (idx !== -1) {
                try {
                    const rec = await pb
                        .collection('ratings')
                        .getOne(e.record.id, {
                            expand: 'route_id.location,user',
                            fields: LIST_FIELDS,
                            requestKey: null,
                        })
                    comments.value[idx] = mapComment(rec)
                } catch {}
                scheduleStatsRefresh()
            }
        }
    })
})

onBeforeUnmount(() => {
    clearTimeout(searchDebounce)
    clearTimeout(statsDebounce)
    scrollObserver?.disconnect()
    scrollObserver = null
})
</script>

<style scoped>
.stats-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
}

.stats-scroll::-webkit-scrollbar {
    display: none;
}

.stats-scroll__inner {
    display: flex;
    gap: 8px;
}

.stat-chip {
    flex: 1 0 auto;
    min-width: 100px;
}

@media (min-width: 600px) {
    .stat-chip {
        flex: 1 1 0;
        min-width: 0;
    }
}

.load-sentinel {
    min-height: 32px;
}

.bulk-bar {
    border-top: 1px solid rgba(var(--v-border-color), 0.12);
    background: rgba(var(--v-theme-primary), 0.05);
    border-radius: 0 0 8px 8px;
}
</style>
