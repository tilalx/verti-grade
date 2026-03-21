<template>
    <v-container class="route-page pa-0" fluid>

        <!-- ── Loading state ──────────────────────────────────────────────── -->
        <template v-if="loading">
            <v-skeleton-loader type="image" height="180" />
            <div class="px-4 pt-4">
                <v-skeleton-loader type="heading" class="mb-3" />
                <v-skeleton-loader type="text" class="mb-2" />
                <v-skeleton-loader type="text" class="mb-6" />
                <v-skeleton-loader v-for="i in 3" :key="i" type="list-item-avatar-two-line" class="mb-3" />
            </div>
        </template>

        <template v-else-if="metadata">
            <!-- ── Hero header ────────────────────────────────────────────── -->
            <div class="route-hero" :style="heroStyle">
                <div class="route-hero__overlay" />
                <div class="route-hero__content">
                    <!-- Type + location -->
                    <div class="d-flex align-center ga-2 mb-2">
                        <v-chip
                            v-if="metadata.type"
                            size="small"
                            variant="flat"
                            color="rgba(255,255,255,0.2)"
                            class="text-white"
                            :prepend-icon="metadata.type === 'Boulder' ? 'mdi-image-filter-hdr' : 'mdi-routes'"
                        >
                            {{ metadata.type }}
                        </v-chip>
                        <v-chip
                            v-if="metadata.location"
                            size="small"
                            variant="flat"
                            color="rgba(255,255,255,0.2)"
                            class="text-white"
                            prepend-icon="mdi-map-marker-outline"
                        >
                            {{ metadata.location }}
                        </v-chip>
                    </div>

                    <!-- Name + difficulty badge inline -->
                    <div class="d-flex align-end justify-space-between ga-3">
                        <div>
                            <h1 class="text-h5 font-weight-bold text-white mb-1" style="line-height:1.2; text-shadow: 0 1px 3px rgba(0,0,0,0.3)">
                                {{ metadata.name }}
                            </h1>

                            <div v-if="metadata.creator?.length" class="d-flex align-center ga-1 mt-1">
                                <v-icon size="14" color="rgba(255,255,255,0.7)">mdi-account-hard-hat-outline</v-icon>
                                <span class="text-body-2" style="color: rgba(255,255,255,0.8)">{{ metadata.creator.join(', ') }}</span>
                            </div>
                        </div>

                        <div v-if="difficulty" class="route-hero__difficulty-badge" :style="difficultyBadgeStyle">
                            <span class="route-hero__difficulty-text font-weight-black">{{ difficulty }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ── Stats bar ──────────────────────────────────────────────── -->
            <v-card class="stats-card mx-4 mt-n4 rounded-xl" style="position: relative; z-index: 2" variant="elevated" elevation="3">
                <div class="d-flex align-center justify-space-around py-3">
                    <!-- Average rating -->
                    <div class="text-center">
                        <div class="d-flex align-center justify-center ga-1">
                            <v-icon color="yellow-darken-2" size="22">mdi-star</v-icon>
                            <span class="text-h6 font-weight-bold">{{ avgRating }}</span>
                        </div>
                        <div class="text-caption text-medium-emphasis">{{ t('ratings.score') }}</div>
                    </div>

                    <v-divider vertical class="my-1" />

                    <!-- Review count -->
                    <div class="text-center">
                        <span class="text-h6 font-weight-bold">{{ reviews.length }}</span>
                        <div class="text-caption text-medium-emphasis">{{ t('ratings.climber_reviews') }}</div>
                    </div>

                    <v-divider vertical class="my-1" />

                    <!-- Perceived difficulty -->
                    <div class="text-center">
                        <div class="d-flex align-center justify-center ga-1">
                            <v-icon size="18" color="primary">mdi-trending-up</v-icon>
                            <span class="text-h6 font-weight-bold">{{ avgPerceivedDifficulty || '—' }}</span>
                        </div>
                        <div class="text-caption text-medium-emphasis">{{ t('ratings.difficulty') }}</div>
                    </div>
                </div>
            </v-card>

            <!-- ── Route details ──────────────────────────────────────────── -->
            <div class="px-4 pt-4">
                <!-- Date + comment -->
                <div v-if="formattedScrewDate || metadata.comment" class="mb-4">
                    <div v-if="formattedScrewDate" class="d-flex align-center ga-2 mb-2">
                        <v-icon size="16" color="medium-emphasis">mdi-calendar-outline</v-icon>
                        <span class="text-body-2 text-medium-emphasis">{{ formattedScrewDate }}</span>
                    </div>
                    <div v-if="metadata.anchor_point && metadata.type !== 'Boulder'" class="d-flex align-center ga-2 mb-2">
                        <v-icon size="16" color="medium-emphasis">mdi-pound</v-icon>
                        <span class="text-body-2 text-medium-emphasis">{{ t('climbing.anchor_point') }}: {{ metadata.anchor_point }}</span>
                    </div>
                    <div v-if="metadata.comment" class="d-flex align-start ga-2">
                        <v-icon size="16" color="medium-emphasis" class="mt-1">mdi-information-outline</v-icon>
                        <span class="text-body-2 text-medium-emphasis font-italic">{{ metadata.comment }}</span>
                    </div>
                </div>

                <!-- ── Rate CTA ───────────────────────────────────────────── -->
                <div class="mb-6">
                    <ReviewFormDialog
                        v-if="route_id"
                        :route-id="route_id"
                        call-to-action
                        @saved="onReviewSaved"
                    />
                </div>

                <!-- ── Reviews section ────────────────────────────────────── -->
                <div class="d-flex align-center justify-space-between mb-3">
                    <span class="text-subtitle-1 font-weight-bold">
                        {{ t('ratings.climber_reviews') }}
                    </span>
                    <v-chip v-if="reviews.length" size="small" variant="tonal" color="primary">
                        {{ reviews.length }}
                    </v-chip>
                </div>

                <!-- Review list -->
                <template v-if="reviews.length">
                    <v-card
                        v-for="(review, idx) in reviews"
                        :key="review.id"
                        rounded="xl"
                        border
                        flat
                        :class="['review-card', 'mb-3', { 'review-card--first': idx === 0 }]"
                    >
                        <div class="pa-4">
                            <!-- Header: avatar + name + time -->
                            <div class="d-flex align-center mb-3">
                                <v-avatar
                                    size="40"
                                    :color="review.userAvatar ? undefined : avatarColor(review.userName)"
                                    class="mr-3"
                                >
                                    <v-img v-if="review.userAvatar" :src="review.userAvatar" cover />
                                    <span v-else class="text-caption font-weight-bold text-white">
                                        {{ initials(review.userName) }}
                                    </span>
                                </v-avatar>
                                <div class="flex-grow-1">
                                    <div class="text-body-2 font-weight-semibold">{{ review.userName }}</div>
                                    <div class="text-caption text-medium-emphasis">{{ timeAgo(review.created) }}</div>
                                </div>
                            </div>

                            <!-- Rating + difficulty row -->
                            <div class="d-flex align-center ga-3 mb-2">
                                <v-rating
                                    v-if="review.rating"
                                    :model-value="review.rating"
                                    readonly
                                    density="compact"
                                    size="18"
                                    active-color="yellow-darken-2"
                                    color="grey-lighten-2"
                                />
                                <v-chip
                                    v-if="review.difficulty"
                                    size="x-small"
                                    color="primary"
                                    variant="tonal"
                                    class="font-weight-bold"
                                >
                                    {{ review.difficulty }}
                                </v-chip>
                            </div>

                            <!-- Comment -->
                            <p v-if="review.comment" class="text-body-2 mb-0" style="line-height: 1.5">
                                {{ review.comment }}
                            </p>
                        </div>
                    </v-card>
                </template>

                <!-- Empty state -->
                <v-card v-else rounded="xl" flat border class="py-10 text-center">
                    <v-icon size="64" color="grey-lighten-1" class="mb-4 empty-icon">mdi-star-shooting-outline</v-icon>
                    <div class="text-h6 font-weight-semibold text-medium-emphasis mb-1">
                        {{ t('ratings.no_reviews_yet') }}
                    </div>
                    <div class="text-body-2 text-disabled">
                        {{ t('ratings.be_the_first') }}
                    </div>
                </v-card>

                <!-- Bottom spacer for mobile -->
                <div style="height: 24px" />
            </div>
        </template>

    </v-container>
</template>

<script setup lang="ts">
import type PocketBase from 'pocketbase'
import type { RatingRecord, RouteListItem, RouteRecord } from '~/types/models'
import { formatDifficulty, normalizeCreators } from '~/utils/formatting'

const { t, locale } = useI18n()
const pb = usePocketbase() as PocketBase
const nuxtRoute = useRoute()

const route_id = ref<string | null>((nuxtRoute.query.id as string) || null)
const loading = ref(true)
const metadata = ref<RouteListItem | null>(null)

interface ReviewDisplay {
    id: string
    rating: number | null
    difficulty: string
    comment: string | null
    created: string
    userName: string
    userAvatar: string | null
}

const reviews = ref<ReviewDisplay[]>([])
let unsubscribe: (() => void | Promise<void>) | null = null

// ── Page meta ──────────────────────────────────────────────────────────────

useHead(
    computed(() => ({
        title: metadata.value?.name
            ? `${metadata.value.name} — Verti-Grade`
            : t('page.title.route'),
    })),
)

// ── Computed ───────────────────────────────────────────────────────────────

const difficulty = computed(() => formatDifficulty(metadata.value))

const heroStyle = computed(() => {
    const color = metadata.value?.color || '#6200EA'
    return {
        background: `linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -30)} 100%)`,
    }
})

const difficultyBadgeStyle = computed(() => {
    const color = metadata.value?.color || '#6200EA'
    return {
        background: color,
        color: isLightColor(color) ? '#1a1a1a' : '#ffffff',
    }
})

const formattedScrewDate = computed(() => {
    if (!metadata.value?.screw_date) return ''
    try {
        return new Date(metadata.value.screw_date).toLocaleDateString(locale.value, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    } catch {
        return ''
    }
})

const avgRating = computed(() => {
    const rated = reviews.value.filter((r) => r.rating !== null)
    if (!rated.length) return '—'
    const sum = rated.reduce((acc, r) => acc + (r.rating ?? 0), 0)
    return (sum / rated.length).toFixed(1)
})

const avgPerceivedDifficulty = computed(() => {
    const withDiff = reviews.value.filter((r) => r.difficulty)
    if (!withDiff.length) return null
    const counts: Record<string, number> = {}
    withDiff.forEach((r) => { counts[r.difficulty] = (counts[r.difficulty] ?? 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
})

// ── Data fetching ──────────────────────────────────────────────────────────

const getRouteMetadata = async (): Promise<void> => {
    if (!route_id.value) {
        navigateTo('/404')
        return
    }
    try {
        const record = await pb.collection('routes').getOne<RouteRecord>(route_id.value)
        metadata.value = {
            ...record,
            creator: normalizeCreators(record.creator),
        }
    } catch {
        navigateTo('/404')
    }
}

const getAllRouteRatings = async (): Promise<void> => {
    if (!route_id.value) return
    try {
        const data = await pb.collection('ratings').getFullList<RatingRecord>({
            filter: `route_id = "${route_id.value}"`,
            sort: '-created',
            expand: 'user',
            requestKey: 'routeRatings',
        })
        reviews.value = data.map(mapReview)
    } catch (err: unknown) {
        if ((err as { isAbort?: boolean })?.isAbort) return
        console.error('Error fetching ratings:', err)
    }
}

function mapReview(r: RatingRecord & { expand?: Record<string, unknown> }): ReviewDisplay {
    const user = r.expand?.user as { name?: string; username?: string; avatar?: string } | undefined
    const userName = user?.name || user?.username || t('comments.anonymous')
    const userAvatar = user?.avatar && user && r.expand?.user
        ? pb.files.getURL(user as Parameters<typeof pb.files.getURL>[0], user.avatar, { thumb: '80x80' })
        : null

    return {
        id: r.id,
        rating: typeof r.rating === 'number' ? r.rating : null,
        difficulty: formatDifficulty(r),
        comment: r.comment ?? null,
        created: r.created ?? '',
        userName,
        userAvatar,
    }
}

function onReviewSaved() {
    void getAllRouteRatings()
}

// ── Display helpers ────────────────────────────────────────────────────────

const AVATAR_COLORS = [
    'primary', 'secondary', 'success', 'info', 'deep-purple',
    'teal', 'indigo', 'pink', 'cyan', 'orange',
]

function avatarColor(name: string): string {
    if (!name) return 'primary'
    const code = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function initials(name: string): string {
    if (!name) return '?'
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() ?? '')
        .join('')
}

function timeAgo(dateStr: string): string {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins  = Math.floor(diff / 60_000)
    const hours = Math.floor(diff / 3_600_000)
    const days  = Math.floor(diff / 86_400_000)
    if (mins  < 1)   return t('time.justNow')
    if (mins  < 60)  return t('time.minutesAgo', { n: mins })
    if (hours < 24)  return t('time.hoursAgo',   { n: hours })
    if (days  < 30)  return t('time.daysAgo',    { n: days })
    return new Date(dateStr).toLocaleDateString(locale.value, { month: 'short', day: 'numeric', year: 'numeric' })
}

function isLightColor(hex: string): boolean {
    let color = hex.replace('#', '')
    if (color.length === 3) {
        color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2]
    }
    const num = parseInt(color, 16)
    const r = (num >> 16) & 0xFF
    const g = (num >> 8) & 0xFF
    const b = num & 0xFF
    // Perceived luminance formula
    return (r * 0.299 + g * 0.587 + b * 0.114) > 160
}

function adjustColor(hex: string, amount: number): string {
    // Darken/lighten a hex color
    let color = hex.replace('#', '')
    if (color.length === 3) {
        color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2]
    }
    const num = parseInt(color, 16)
    const r = Math.min(255, Math.max(0, ((num >> 16) & 0xFF) + amount))
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount))
    const b = Math.min(255, Math.max(0, (num & 0xFF) + amount))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// ── Lifecycle ──────────────────────────────────────────────────────────────

onMounted(async () => {
    if (!route_id.value) {
        navigateTo('/404')
        return
    }
    await Promise.all([getRouteMetadata(), getAllRouteRatings()])
    loading.value = false

    unsubscribe = await pb.collection('ratings').subscribe('*', (event) => {
        if (event.record.route_id === route_id.value) {
            void getAllRouteRatings()
        }
    })
})

onBeforeUnmount(async () => {
    if (unsubscribe) {
        await unsubscribe()
        unsubscribe = null
    }
})
</script>

<style scoped>
.route-page {
    max-width: 600px;
    margin: 0 auto;
    padding-bottom: env(safe-area-inset-bottom, 0);
}

/* ── Hero header ─────────────────────────────────────────────────────────── */
.route-hero {
    position: relative;
    min-height: 180px;
    padding: 20px 20px 28px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    overflow: hidden;
}

/* Round hero corners on desktop */
@media (min-width: 600px) {
    .route-hero {
        border-radius: 0 0 16px 16px;
    }
}

.route-hero__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.05) 60%, transparent 100%);
    pointer-events: none;
}

.route-hero__content {
    position: relative;
    z-index: 1;
}

.route-hero__difficulty-badge {
    flex-shrink: 0;
    min-width: 52px;
    height: 52px;
    padding: 0 12px;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
}

.route-hero__difficulty-text {
    font-size: 1.25rem;
    line-height: 1;
    white-space: nowrap;
}

.stats-card {
    background: rgb(var(--v-theme-surface)) !important;
}

/* ── Review cards ────────────────────────────────────────────────────────── */
.review-card {
    transition: transform 0.15s ease;
}

/* ── Empty state icon animation ──────────────────────────────────────────── */
.empty-icon {
    animation: gentle-bounce 2s ease-in-out infinite;
}

@keyframes gentle-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
}
</style>
