<template>
    <v-container fluid class="comments-page">
        <!-- ── Page Header + inline stats ────────────────────────────────── -->
        <div class="d-flex align-center justify-space-between mb-3">
            <h1 class="text-h5 font-weight-bold">{{ t('routes.comments') }}</h1>
        </div>

        <!-- Stats: horizontal scroll on mobile, row on desktop -->
        <div class="stats-scroll mb-3">
            <div class="stats-scroll__inner">
                <v-card
                    rounded="lg"
                    border
                    flat
                    class="stat-chip pa-2 px-3 text-center"
                >
                    <div class="text-h6 font-weight-bold text-primary">
                        {{ statsData.length }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                        {{ t('comments.totalReviews') }}
                    </div>
                </v-card>
                <v-card
                    rounded="lg"
                    border
                    flat
                    class="stat-chip pa-2 px-3 text-center"
                >
                    <div class="d-flex align-center justify-center ga-1">
                        <span class="text-h6 font-weight-bold text-warning">{{
                            stats.avgRating
                        }}</span>
                        <v-icon color="yellow-darken-2" size="16"
                            >mdi-star</v-icon
                        >
                    </div>
                    <div class="text-caption text-medium-emphasis">
                        {{ t('comments.avgRating') }}
                    </div>
                </v-card>
                <v-card
                    rounded="lg"
                    border
                    flat
                    class="stat-chip pa-2 px-3 text-center"
                >
                    <div class="text-h6 font-weight-bold text-success">
                        {{ stats.thisWeek }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                        {{ t('comments.thisWeek') }}
                    </div>
                </v-card>
                <v-card
                    rounded="lg"
                    border
                    flat
                    class="stat-chip pa-2 px-3 text-center"
                >
                    <div class="text-h6 font-weight-bold text-error">
                        {{ stats.lowRated }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                        {{ t('comments.lowRated') }}
                    </div>
                </v-card>
            </div>
        </div>

        <!-- ── Filter bar ────────────────────────────────────────────────── -->
        <v-card rounded="xl" border flat class="mb-4">
            <v-card-text class="pb-2">
                <!-- Search + filter toggle row -->
                <div class="d-flex align-center ga-2">
                    <v-text-field
                        v-model="search"
                        :label="t('actions.search')"
                        prepend-inner-icon="mdi-magnify"
                        clearable
                        hide-details
                        density="compact"
                        variant="outlined"
                        rounded="lg"
                        class="flex-grow-1"
                    />
                    <v-btn
                        :icon="
                            filtersExpanded
                                ? 'mdi-filter-off'
                                : 'mdi-filter-variant'
                        "
                        variant="tonal"
                        density="compact"
                        size="small"
                        class="d-sm-none"
                        @click="filtersExpanded = !filtersExpanded"
                    />
                </div>

                <!-- Collapsible filters: always visible on sm+, toggle on mobile -->
                <v-expand-transition>
                    <div v-show="filtersExpanded || !isMobile">
                        <v-row
                            density="comfortable"
                            align="center"
                            class="mt-2"
                        >
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
                                    variant="outlined"
                                    rounded="lg"
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
                                    variant="outlined"
                                    rounded="lg"
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
                                    variant="outlined"
                                    rounded="lg"
                                    prepend-inner-icon="mdi-sort"
                                />
                            </v-col>
                        </v-row>

                        <!-- Rating chips + date toggle -->
                        <v-row
                            density="comfortable"
                            align="center"
                            class="mt-1"
                        >
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
                    </div>
                </v-expand-transition>
            </v-card-text>

            <!-- Bulk-action bar, slides in when items are selected -->
            <v-slide-y-transition>
                <div
                    v-if="selectedCount > 0"
                    class="bulk-bar px-4 py-2 d-flex align-center ga-2 flex-wrap"
                >
                    <v-icon size="18" color="primary">mdi-check-circle</v-icon>
                    <span class="text-body-2 font-weight-medium">
                        {{ t('comments.selected', { n: selectedCount }) }}
                    </span>
                    <v-spacer />
                    <v-btn size="small" variant="text" @click="clearSelection">
                        {{ t('actions.cancel') }}
                    </v-btn>
                    <v-btn
                        size="small"
                        color="error"
                        variant="tonal"
                        prepend-icon="mdi-delete"
                        @click="bulkDeleteDialog = true"
                    >
                        {{ t('comments.deleteSelected', { n: selectedCount }) }}
                    </v-btn>
                </div>
            </v-slide-y-transition>
        </v-card>

        <!-- ── Loading skeletons ───────────────────────────────────────────── -->
        <v-row v-if="loading && !comments.length">
            <v-col v-for="i in 6" :key="i" cols="12" sm="6" lg="4">
                <v-skeleton-loader type="card-avatar" rounded="xl" />
            </v-col>
        </v-row>

        <!-- ── Empty state ─────────────────────────────────────────────────── -->
        <v-card
            v-else-if="!loading && !comments.length"
            rounded="xl"
            border
            flat
            class="py-16 text-center"
        >
            <v-icon size="56" color="grey-lighten-2"
                >mdi-comment-off-outline</v-icon
            >
            <div class="text-h6 mt-4 text-medium-emphasis">
                {{ t('comments.noComments') }}
            </div>
            <div class="text-body-2 text-disabled mt-1">
                {{ t('comments.noCommentsHint') }}
            </div>
        </v-card>

        <!-- ── Comment Cards ───────────────────────────────────────────────── -->
        <v-row v-else>
            <v-col
                v-for="comment in comments"
                :key="comment.id"
                cols="12"
                sm="6"
                lg="4"
            >
                <v-card
                    rounded="xl"
                    border
                    flat
                    class="comment-card d-flex flex-column"
                    :class="{
                        'comment-card--selected': selectedMap[comment.id],
                    }"
                >
                    <!-- Header: avatar + user + date + star rating -->
                    <v-card-item class="pb-1 pt-3">
                        <template #prepend>
                            <v-avatar
                                size="38"
                                :color="
                                    selectedMap[comment.id]
                                        ? 'primary'
                                        : comment.userAvatar
                                          ? undefined
                                          : avatarColor(comment.userName)
                                "
                                class="select-avatar"
                                :title="
                                    t(
                                        selectedMap[comment.id]
                                            ? 'comments.deselect'
                                            : 'comments.select',
                                    )
                                "
                                @click="toggleSelect(comment.id)"
                            >
                                <v-icon
                                    v-if="selectedMap[comment.id]"
                                    color="white"
                                    size="20"
                                    >mdi-check</v-icon
                                >
                                <v-img
                                    v-else-if="comment.userAvatar"
                                    :src="comment.userAvatar"
                                    cover
                                />
                                <span
                                    v-else
                                    class="text-caption font-weight-bold text-white"
                                >
                                    {{ initials(comment.userName) }}
                                </span>
                            </v-avatar>
                        </template>

                        <v-card-title
                            class="text-body-2 font-weight-semibold px-0 py-0"
                            style="line-height: 1.3"
                        >
                            {{ comment.userName }}
                        </v-card-title>
                        <v-card-subtitle
                            class="text-caption px-0 py-0"
                            style="opacity: 0.7"
                        >
                            {{ formatDate(comment.created) }}
                        </v-card-subtitle>

                        <template #append>
                            <v-rating
                                :model-value="comment.rating"
                                readonly
                                density="compact"
                                size="small"
                                active-color="yellow-darken-2"
                                color="grey-lighten-2"
                            />
                        </template>
                    </v-card-item>

                    <!-- Route name + location + difficulty chips -->
                    <div class="px-4 pb-2 d-flex flex-wrap align-center ga-1">
                        <NuxtLink
                            :to="`/route?id=${comment.expand?.route_id?.id}`"
                            class="text-body-2 font-weight-medium text-primary text-decoration-none route-link"
                        >
                            <v-icon size="13" class="mb-1 mr-1"
                                >mdi-routes</v-icon
                            >{{ comment.routeName }}
                        </NuxtLink>
                        <v-chip
                            v-if="comment.location"
                            size="x-small"
                            variant="tonal"
                            class="ml-1"
                        >
                            {{ comment.location }}
                        </v-chip>
                        <v-chip
                            v-if="comment.difficulty != null"
                            size="x-small"
                            color="primary"
                            variant="tonal"
                        >
                            {{ formatDifficulty(comment) }}
                        </v-chip>
                    </div>

                    <v-divider class="mx-4" />

                    <!-- Comment body (collapsible) -->
                    <v-card-text class="py-3 flex-grow-1">
                        <p
                            class="text-body-2 comment-text mb-0"
                            :class="{
                                'comment-collapsed': !expandedIds.has(
                                    comment.id,
                                ),
                            }"
                        >
                            {{ comment.comment }}
                        </p>
                        <v-btn
                            v-if="isLong(comment.comment)"
                            variant="text"
                            density="compact"
                            size="x-small"
                            :color="
                                expandedIds.has(comment.id)
                                    ? 'default'
                                    : 'primary'
                            "
                            class="mt-1 px-0 text-none"
                            @click="toggleExpand(comment.id)"
                        >
                            {{
                                expandedIds.has(comment.id)
                                    ? t('comments.showLess')
                                    : t('comments.showMore')
                            }}
                        </v-btn>
                    </v-card-text>

                    <!-- Actions -->
                    <v-card-actions class="pt-0 px-2 pb-2">
                        <v-btn
                            size="small"
                            variant="text"
                            density="compact"
                            class="text-none"
                            :color="
                                selectedMap[comment.id] ? 'primary' : 'default'
                            "
                            :prepend-icon="
                                selectedMap[comment.id]
                                    ? 'mdi-check-circle'
                                    : 'mdi-circle-outline'
                            "
                            @click="toggleSelect(comment.id)"
                        >
                            {{
                                t(
                                    selectedMap[comment.id]
                                        ? 'comments.deselect'
                                        : 'comments.select',
                                )
                            }}
                        </v-btn>
                        <v-spacer />
                        <v-btn
                            icon
                            size="small"
                            variant="text"
                            @click="openEdit(comment)"
                        >
                            <v-icon size="18">mdi-pencil-outline</v-icon>
                            <v-tooltip activator="parent" location="top">{{
                                t('actions.edit')
                            }}</v-tooltip>
                        </v-btn>
                        <CommentsDeleteComment
                            :commentId="comment.id"
                            @comment-deleted="onCommentDeleted(comment.id)"
                        />
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>

        <!-- Result count + load more -->
        <div v-if="!loading && comments.length" class="text-center mt-4">
            <p class="text-caption text-medium-emphasis mb-3">
                {{
                    t('comments.showing', {
                        n: comments.length,
                        total: totalItems,
                    })
                }}
            </p>
            <v-btn
                v-if="hasMore"
                variant="tonal"
                rounded="lg"
                :loading="loadingMore"
                @click="loadMore"
            >
                {{ t('actions.load_more') }}
            </v-btn>
        </div>

        <!-- ── Edit Dialog (shared ReviewFormDialog component) ────────────── -->
        <ReviewFormDialog
            v-model="editDialog"
            :review="editingReview"
            @saved="onReviewSaved"
        />

        <!-- ── Bulk Delete Dialog ───────────────────────────────────────────── -->
        <v-dialog v-model="bulkDeleteDialog" max-width="380">
            <v-card rounded="xl">
                <v-card-title
                    class="pa-5 pb-3 text-body-1 font-weight-semibold"
                >
                    {{ t('comments.bulkDeleteTitle', { n: selectedCount }) }}
                </v-card-title>
                <v-card-text class="pa-5 pt-0 text-body-2 text-medium-emphasis">
                    {{ t('notifications.deleteMoreItems') }}
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn variant="text" @click="bulkDeleteDialog = false">{{
                        t('actions.cancel')
                    }}</v-btn>
                    <v-spacer />
                    <v-btn
                        color="error"
                        variant="flat"
                        :loading="bulkDeleting"
                        @click="bulkDelete"
                    >
                        {{ t('actions.delete') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- ── Snackbar ────────────────────────────────────────────────────── -->
        <v-snackbar
            v-model="snackbar.show"
            :color="snackbar.color"
            location="top"
            timeout="4000"
        >
            {{ snackbar.message }}
        </v-snackbar>
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
    authRequired: true,
    middleware: ['auth'],
    requiredPermission: 'manage_comments',
})

// ── State ──────────────────────────────────────────────────────────────────

const filtersExpanded = ref(false)
const isMobile = ref(false)

const loading = ref(true)
const loadingMore = ref(false)
const bulkDeleting = ref(false)

// Display list (current page accumulation)
const comments = ref([])
// Lightweight stats dataset (id + rating + created, no expand)
const statsData = ref([])

// Pagination
const page = ref(1)
const PER_PAGE = 48
const totalItems = ref(0)
const hasMore = computed(() => comments.value.length < totalItems.value)

// Filters
const search = ref('')
const selectedLocation = ref(null)
const selectedDifficulty = ref(null)
const selectedRating = ref(0) // 0 = sentinel for "all ratings"
const dateFilter = ref('')
const sortOrder = ref('newest')

// Expanded set (recreated on mutation to stay reactive)
const expandedIds = ref(new Set())

// Selection: reactive object { [id]: true } — Vue tracks per-key access,
// so toggling one ID only re-renders that one card instead of all of them.
const selectedMap = reactive({})
const selectedCount = computed(() => Object.keys(selectedMap).length)

// Edit dialog — review object passed to ReviewFormDialog
const editDialog = ref(false)
const editingReview = ref(null)

// Bulk delete dialog
const bulkDeleteDialog = ref(false)

// Snackbar
const snackbar = reactive({ show: false, message: '', color: 'success' })

// ── Static options ─────────────────────────────────────────────────────────

const difficulties = computed(() => [
    { text: t('filter.all'), value: null },
    ...Array.from({ length: 10 }, (_, i) => ({
        text: String(i + 1),
        value: i + 1,
    })),
])

const locations = computed(() => [
    { text: t('filter.all'), value: null },
    { text: 'Hanau', value: 'Hanau' },
    { text: 'Gelnhausen', value: 'Gelnhausen' },
])

const sortOptions = computed(() => [
    { label: t('comments.sortNewest'), value: 'newest' },
    { label: t('comments.sortOldest'), value: 'oldest' },
    { label: t('comments.sortHighest'), value: 'highest' },
    { label: t('comments.sortLowest'), value: 'lowest' },
])

// ── Stats (computed from lightweight dataset — no expand, all records) ──────

const stats = computed(() => {
    const data = statsData.value
    if (!data.length) return { avgRating: '—', thisWeek: 0, lowRated: 0 }

    const sum = data.reduce((acc, c) => acc + (c.rating ?? 0), 0)
    const avgRating = (sum / data.length).toFixed(1)

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const thisWeek = data.filter(
        (c) => new Date(c.created).getTime() > weekAgo,
    ).length
    const lowRated = data.filter(
        (c) => c.rating !== null && c.rating <= 2,
    ).length

    return { avgRating, thisWeek, lowRated }
})

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

function mapComment(c) {
    return {
        ...c,
        routeName: c.expand?.route_id?.name ?? 'N/A',
        location: c.expand?.route_id?.location ?? null,
        userName:
            c.expand?.user?.name ||
            c.expand?.user?.username ||
            t('comments.anonymous'),
        userAvatar: c.expand?.user?.avatar
            ? pb.files.getURL(c.expand.user, c.expand.user.avatar, {
                  thumb: '100x100',
              })
            : null,
    }
}

// Lightweight: fetch all records with minimal fields for stats (no expand)
const fetchStats = async () => {
    try {
        const data = await pb.collection('ratings').getFullList({
            fields: 'id,rating,created',
            requestKey: 'commentsStats',
        })
        statsData.value = data
    } catch (err) {
        if (err?.isAbort) return
    }
}

// Paginated list with server-side filtering and sorting
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
                expand: 'route_id,user',
                requestKey: 'commentsList',
            })
        totalItems.value = result.totalItems
        const mapped = result.items.map(mapComment)
        comments.value = append ? [...comments.value, ...mapped] : mapped
    } catch (err) {
        if (err?.isAbort) return
        console.error('Failed to fetch comments:', err)
        showSnackbar(t('notifications.error.generic'), 'error')
    } finally {
        loading.value = false
        loadingMore.value = false
    }
}

async function loadMore() {
    page.value++
    await fetchList(true)
}

// ── Watchers ───────────────────────────────────────────────────────────────

// Debounce search: 300ms after last keystroke
let searchDebounce = null
watch(search, () => {
    clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => fetchList(), 300)
})

// Filters that should refetch immediately (no debounce)
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
    showSnackbar(t('notifications.success.edit'))
    fetchStats()
}

// ── Single comment deleted (from CommentsDeleteComment component) ────────────

function onCommentDeleted(id) {
    comments.value = comments.value.filter((c) => c.id !== id)
    totalItems.value = Math.max(0, totalItems.value - 1)
    fetchStats()
}

// ── Bulk delete ────────────────────────────────────────────────────────────

async function bulkDelete() {
    bulkDeleting.value = true
    try {
        const ids = Object.keys(selectedMap)
        await Promise.all(ids.map((id) => pb.collection('ratings').delete(id)))
        // Remove from local list — avoid full refetch
        comments.value = comments.value.filter((c) => !ids.includes(c.id))
        totalItems.value = Math.max(0, totalItems.value - ids.length)
        showSnackbar(t('notifications.success.delete'))
        clearSelection()
        bulkDeleteDialog.value = false
        fetchStats()
    } catch (err) {
        console.error('Error bulk deleting:', err)
        showSnackbar(t('notifications.error.generic'), 'error')
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

// ── Expand/collapse helpers ────────────────────────────────────────────────

const LONG_THRESHOLD = 200

function isLong(text) {
    return typeof text === 'string' && text.length > LONG_THRESHOLD
}

function toggleExpand(id) {
    const next = new Set(expandedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    expandedIds.value = next
}

// ── Display helpers ────────────────────────────────────────────────────────

function initials(name) {
    if (!name) return '?'
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() ?? '')
        .join('')
}

const AVATAR_COLORS = [
    'primary',
    'secondary',
    'success',
    'info',
    'deep-purple',
    'teal',
    'indigo',
    'pink',
    'cyan',
    'orange',
]

function avatarColor(name) {
    if (!name) return 'primary'
    const code = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function formatDate(date) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

function showSnackbar(message, color = 'success') {
    snackbar.message = message
    snackbar.color = color
    snackbar.show = true
}

// ── Lifecycle ──────────────────────────────────────────────────────────────

let unsubscribe
onMounted(async () => {
    // Detect mobile for collapsible filters
    const mql = window.matchMedia('(max-width: 599.98px)')
    isMobile.value = mql.matches
    mql.addEventListener('change', (e) => {
        isMobile.value = e.matches
    })

    // Fetch both in parallel: stats don't need to wait for the list
    await Promise.all([fetchList(), fetchStats()])

    unsubscribe = await pb.collection('ratings').subscribe('*', async (e) => {
        // Handle realtime events without a full refetch
        if (e.action === 'delete') {
            comments.value = comments.value.filter((c) => c.id !== e.record.id)
            totalItems.value = Math.max(0, totalItems.value - 1)
            fetchStats()
        } else if (e.action === 'create') {
            totalItems.value++
            // Prepend to list only when showing newest-first on the first "page"
            if (sortOrder.value === 'newest' && !hasMore.value) {
                try {
                    const rec = await pb
                        .collection('ratings')
                        .getOne(e.record.id, {
                            expand: 'route_id,user',
                            requestKey: null,
                        })
                    comments.value = [mapComment(rec), ...comments.value]
                } catch {}
            }
            fetchStats()
        } else if (e.action === 'update') {
            const idx = comments.value.findIndex((c) => c.id === e.record.id)
            if (idx !== -1) {
                try {
                    const rec = await pb
                        .collection('ratings')
                        .getOne(e.record.id, {
                            expand: 'route_id,user',
                            requestKey: null,
                        })
                    comments.value[idx] = mapComment(rec)
                } catch {}
                fetchStats()
            }
        }
    })
})

onBeforeUnmount(() => {
    unsubscribe?.()?.catch?.(() => {})
})
</script>

<style scoped>
.comments-page {
    max-width: 100%;
}

/* ── Stats horizontal scroll ─────────────────────────────────────────── */
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

/* Card selection highlight */
.comment-card {
    transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
}

.comment-card--selected {
    border-color: rgb(var(--v-theme-primary)) !important;
    box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.18) !important;
}

/* Avatar turns into a toggle button */
.select-avatar {
    cursor: pointer;
    transition:
        background-color 0.15s ease,
        opacity 0.15s ease;
}

.select-avatar:hover {
    opacity: 0.85;
}

/* Route name link */
.route-link:hover {
    text-decoration: underline !important;
}

/* Comment text: collapsed = 4 lines max */
.comment-text {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
}

.comment-collapsed {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Bulk action bar that slides in at the bottom of the filter card */
.bulk-bar {
    border-top: 1px solid rgba(var(--v-border-color), 0.12);
    background: rgba(var(--v-theme-primary), 0.05);
    border-radius: 0 0 24px 24px;
}
</style>
