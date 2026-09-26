<template>
    <v-container class="route-page pa-0">
        <!-- ── Loading state ──────────────────────────────────────────────── -->
        <template v-if="loading">
            <v-skeleton-loader type="image" height="180" />
            <div class="px-4 pt-4">
                <v-skeleton-loader type="heading" class="mb-3" />
                <v-skeleton-loader type="text" class="mb-2" />
                <v-skeleton-loader type="text" class="mb-6" />
                <v-skeleton-loader
                    v-for="i in 3"
                    :key="i"
                    type="list-item-avatar-two-line"
                    class="mb-3"
                />
            </div>
        </template>

        <template v-else-if="metadata">
            <div class="route-layout">
                <div class="route-layout__main">
                    <!-- ── Hero header ────────────────────────────────────────────── -->
                    <div
                        class="route-hero"
                        data-testid="route-hero"
                        :style="heroStyle"
                    >
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
                                    :prepend-icon="
                                        metadata.type === 'Boulder'
                                            ? 'mdi-image-filter-hdr'
                                            : 'mdi-routes'
                                    "
                                >
                                    {{ metadata.type }}
                                </v-chip>
                                <v-chip
                                    v-if="locationName(metadata)"
                                    size="small"
                                    variant="flat"
                                    color="rgba(255,255,255,0.2)"
                                    class="text-white"
                                    prepend-icon="mdi-map-marker-outline"
                                >
                                    {{ locationName(metadata) }}
                                </v-chip>
                            </div>

                            <!-- Name + difficulty badge inline -->
                            <div
                                class="d-flex align-end justify-space-between ga-3"
                            >
                                <div>
                                    <h1
                                        class="text-headline-small font-weight-bold text-white mb-1"
                                        style="
                                            line-height: 1.2;
                                            text-shadow: 0 1px 3px
                                                rgba(0, 0, 0, 0.3);
                                        "
                                        data-testid="route-page-name"
                                    >
                                        {{ metadata.name }}
                                    </h1>

                                    <div
                                        v-if="metadata.creator?.length"
                                        class="d-flex align-center ga-1 mt-1"
                                    >
                                        <v-icon
                                            size="14"
                                            color="rgba(255,255,255,0.7)"
                                            >mdi-account-hard-hat-outline</v-icon
                                        >
                                        <span
                                            class="text-body-medium"
                                            style="
                                                color: rgba(255, 255, 255, 0.8);
                                            "
                                            >{{
                                                metadata.creator.join(', ')
                                            }}</span
                                        >
                                    </div>
                                </div>

                                <GradeConversionDialog
                                    v-if="difficulty"
                                    :source="metadata"
                                >
                                    <template #activator="{ props: activator }">
                                        <button
                                            v-bind="activator"
                                            type="button"
                                            class="route-hero__difficulty-badge"
                                            :style="difficultyBadgeStyle"
                                            :aria-label="
                                                t('gradeConversion.show')
                                            "
                                            :title="t('gradeConversion.show')"
                                            data-testid="route-grade-badge"
                                        >
                                            <span
                                                class="route-hero__difficulty-text font-weight-black"
                                                >{{ difficulty }}</span
                                            >
                                            <span
                                                v-if="metadata?.grade_system"
                                                class="route-hero__difficulty-system"
                                                data-testid="route-grade-system"
                                                >{{
                                                    t(
                                                        `gradeSystemsShort.${metadata.grade_system}`,
                                                    )
                                                }}</span
                                            >
                                        </button>
                                    </template>
                                </GradeConversionDialog>
                            </div>
                        </div>
                    </div>

                    <!-- ── Stats bar ──────────────────────────────────────────────── -->
                    <v-card class="stats-card mx-4 mt-n4" elevation="3">
                        <div
                            class="d-flex align-center justify-space-around py-3"
                        >
                            <!-- Average rating -->
                            <div class="text-center">
                                <div
                                    class="d-flex align-center justify-center ga-1"
                                >
                                    <v-icon color="yellow-darken-2" size="22"
                                        >mdi-star</v-icon
                                    >
                                    <span
                                        class="text-title-large font-weight-bold"
                                        data-testid="route-avg-rating"
                                        >{{ avgRating }}</span
                                    >
                                </div>
                                <div
                                    class="text-body-small text-medium-emphasis"
                                >
                                    {{ t('ratings.score') }}
                                </div>
                            </div>

                            <v-divider vertical class="my-1" />

                            <!-- Review count -->
                            <div class="text-center">
                                <span
                                    class="text-title-large font-weight-bold"
                                    >{{ reviews.length }}</span
                                >
                                <div
                                    class="text-body-small text-medium-emphasis"
                                >
                                    {{ t('ratings.climber_reviews') }}
                                </div>
                            </div>

                            <v-divider vertical class="my-1" />

                            <!-- Perceived difficulty -->
                            <div class="text-center">
                                <div
                                    class="d-flex align-center justify-center ga-1"
                                >
                                    <v-icon size="18" color="primary"
                                        >mdi-trending-up</v-icon
                                    >
                                    <span
                                        class="text-title-large font-weight-bold"
                                        >{{
                                            avgPerceivedDifficulty || '—'
                                        }}</span
                                    >
                                </div>
                                <div
                                    class="text-body-small text-medium-emphasis"
                                >
                                    {{ t('ratings.difficulty') }}
                                </div>
                            </div>
                        </div>
                    </v-card>

                    <!-- ── Route details ──────────────────────────────────────────── -->
                    <div
                        class="route-details px-4 pt-4"
                        data-testid="route-details"
                    >
                        <!-- Date + comment -->
                        <div
                            v-if="formattedScrewDate || metadata.comment"
                            class="mb-4"
                        >
                            <div
                                v-if="formattedScrewDate"
                                class="d-flex align-center ga-2 mb-2"
                            >
                                <v-icon size="16" color="medium-emphasis"
                                    >mdi-calendar-outline</v-icon
                                >
                                <span
                                    class="text-body-medium text-medium-emphasis"
                                    >{{ formattedScrewDate }}</span
                                >
                            </div>
                            <div
                                v-if="
                                    metadata.anchor_point &&
                                    metadata.type !== 'Boulder'
                                "
                                class="d-flex align-center ga-2 mb-2"
                            >
                                <v-icon size="16" color="medium-emphasis"
                                    >mdi-pound</v-icon
                                >
                                <span
                                    class="text-body-medium text-medium-emphasis"
                                    >{{ t('climbing.anchor_point') }}:
                                    {{ metadata.anchor_point }}</span
                                >
                            </div>
                            <div
                                v-if="metadata.comment"
                                class="d-flex align-start ga-2"
                            >
                                <v-icon
                                    size="16"
                                    color="medium-emphasis"
                                    class="mt-1"
                                    >mdi-information-outline</v-icon
                                >
                                <span
                                    class="text-body-medium text-medium-emphasis font-italic"
                                    >{{ metadata.comment }}</span
                                >
                            </div>
                        </div>

                        <div
                            v-if="isLoggedIn && route_id"
                            class="d-flex align-center ga-2 mb-3"
                        >
                            <v-btn
                                color="success"
                                variant="tonal"
                                size="large"
                                class="flex-grow-1"
                                prepend-icon="mdi-check-circle-outline"
                                data-testid="tick-open"
                                @click="tickDialog = true"
                            >
                                {{ t('ticks.logAscent') }}
                            </v-btn>
                            <v-chip
                                v-if="tickedRouteIds.has(route_id)"
                                color="success"
                                prepend-icon="mdi-check"
                                data-testid="route-ticked"
                            >
                                {{ t('ticks.sent') }}
                            </v-chip>
                            <TickDialog
                                v-model="tickDialog"
                                :route-id="route_id"
                                @saved="refreshTickedRoutes()"
                            />
                        </div>

                        <!-- ── Rate CTA ───────────────────────────────────────────── -->
                        <div class="mb-6">
                            <ReviewFormDialog
                                v-if="route_id"
                                :route-id="route_id"
                                :grade-system="metadata?.grade_system"
                                call-to-action
                                @saved="onReviewSaved"
                            />
                        </div>
                    </div>
                </div>

                <!-- ── Reviews section ────────────────────────────────────────── -->
                <div
                    class="route-layout__reviews px-4 pt-4"
                    data-testid="route-reviews"
                >
                    <div class="d-flex align-center justify-space-between mb-3">
                        <span class="text-body-large font-weight-bold">
                            {{ t('ratings.climber_reviews') }}
                        </span>
                        <v-chip
                            v-if="reviews.length"
                            size="small"
                            variant="tonal"
                            color="primary"
                        >
                            {{ reviews.length }}
                        </v-chip>
                    </div>

                    <!-- Review list -->
                    <div v-if="reviews.length" class="route-reviews-list">
                        <CommentsCard
                            v-for="review in reviews"
                            :key="review.id"
                            :comment="review"
                            date-format="relative"
                            class="mb-3"
                            :class="{
                                'comment-card--target':
                                    review.id === targetCommentId,
                            }"
                        >
                            <template #actions>
                                <v-btn
                                    icon="mdi-flag-outline"
                                    variant="text"
                                    size="small"
                                    :aria-label="t('reports.reportAction')"
                                    :title="t('reports.reportAction')"
                                    data-testid="comment-card-report"
                                    @click="openReport(review.id)"
                                />
                            </template>
                        </CommentsCard>
                    </div>

                    <!-- Empty state -->
                    <LayoutEmptyState
                        v-else
                        icon="mdi-star-shooting-outline"
                        :title="t('ratings.no_reviews_yet')"
                        :hint="t('ratings.be_the_first')"
                    />

                    <ReportsFormDialog
                        v-if="reportTarget"
                        v-model="reportDialog"
                        content-type="rating"
                        :content-id="reportTarget"
                        :content-url="reportUrl"
                    />

                    <!-- Bottom spacer for mobile -->
                    <div style="height: 24px" />
                </div>
            </div>
        </template>
    </v-container>
</template>

<script setup lang="ts">
import { isAbortError } from '~/utils/errors'
import type PocketBase from 'pocketbase'
import type { RatingRecord, RouteListItem, RouteRecord } from '~/types/models'
import {
    formatDate,
    locationName,
    normalizeCreators,
} from '#shared/utils/formatting'
import { formatGrade } from '#shared/utils/grades'
import { reportContentUrl } from '~/utils/reports'

const { t, locale } = useI18n()
const pb = usePocketbase() as PocketBase
const nuxtRoute = useRoute()

const route_id = ref<string | null>((nuxtRoute.query.id as string) || null)

const targetCommentId = ref('')
const loading = ref(true)
const metadata = ref<RouteListItem | null>(null)

interface ReviewDisplay {
    id: string
    rating: number | null
    difficultyLabel: string
    comment: string | null
    created: string
    userName: string
    userAvatar: string | null
}

const reviews = ref<ReviewDisplay[]>([])

const reportDialog = ref(false)
const reportTarget = ref<string | null>(null)
const reportUrl = computed(() =>
    reportTarget.value
        ? reportContentUrl('rating', reportTarget.value, route_id.value)
        : '',
)

function openReport(id: string) {
    reportTarget.value = id
    reportDialog.value = true
}

const { subscribe } = usePbSubscription()
const isLoggedIn = pb.authStore.isValid
const tickDialog = ref(false)
const { tickedRouteIds, refreshTickedRoutes } = useTickedRoutes()
const { error: notifyError } = useNotification()

// ── Page meta ──────────────────────────────────────────────────────────────

useHead(
    computed(() => ({
        title: metadata.value?.name
            ? t('page.title.routeNamed', { name: metadata.value.name })
            : t('page.title.route'),
    })),
)

// ── Computed ───────────────────────────────────────────────────────────────

const difficulty = computed(() => formatGrade(metadata.value))

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

const formattedScrewDate = computed(() =>
    formatDate(metadata.value?.screw_date, {
        locale: locale.value,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }),
)

const seoDescription = () =>
    [difficulty.value, locationName(metadata.value), formattedScrewDate.value]
        .filter(Boolean)
        .join(' · ')

useSeoMeta({
    description: seoDescription,
    ogTitle: () => metadata.value?.name || t('page.title.route'),
    ogDescription: seoDescription,
    ogType: 'article',
})

const avgRating = computed(() => {
    const rated = reviews.value.filter((r) => r.rating !== null)
    if (!rated.length) return '—'
    const sum = rated.reduce((acc, r) => acc + (r.rating ?? 0), 0)
    return (sum / rated.length).toFixed(1)
})

const avgPerceivedDifficulty = computed(() => {
    const withDiff = reviews.value.filter((r) => r.difficultyLabel)
    if (!withDiff.length) return null
    const counts: Record<string, number> = {}
    withDiff.forEach((r) => {
        counts[r.difficultyLabel] = (counts[r.difficultyLabel] ?? 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
})

// ── Data fetching ──────────────────────────────────────────────────────────

const getRouteMetadata = async (): Promise<void> => {
    if (!route_id.value) return
    try {
        const record = await pb
            .collection('routes')
            .getOne<RouteRecord>(route_id.value, { expand: 'location' })
        metadata.value = {
            ...record,
            creator: normalizeCreators(record.creator),
        }
    } catch {
        metadata.value = null
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
        if (isAbortError(err)) return
        console.error('Error fetching ratings:', err)
        notifyError(t('ratings.loadError'))
    }
}

function mapReview(
    r: RatingRecord & { expand?: Record<string, unknown> },
): ReviewDisplay {
    const user = r.expand?.user as
        { name?: string; username?: string; avatar?: string } | undefined
    const userName = user?.name || user?.username || t('comments.anonymous')
    const userAvatar = r.expand?.user
        ? usePbFileUrl(r.expand.user, user?.avatar, { thumb: '80x80' }) || null
        : null

    return {
        id: r.id,
        rating: typeof r.rating === 'number' ? r.rating : null,
        difficultyLabel: formatGrade(r),
        comment: r.comment ?? null,
        created: r.created ?? '',
        userName,
        userAvatar,
    }
}

function onReviewSaved() {
    void getAllRouteRatings()
}

function isLightColor(hex: string): boolean {
    let color = hex.replace('#', '')
    if (color.length === 3) {
        color = [...color].map((digit) => digit + digit).join('')
    }
    const num = parseInt(color, 16)
    const r = (num >> 16) & 0xff
    const g = (num >> 8) & 0xff
    const b = num & 0xff
    return r * 0.299 + g * 0.587 + b * 0.114 > 160
}

function adjustColor(hex: string, amount: number): string {
    let color = hex.replace('#', '')
    if (color.length === 3) {
        color = [...color].map((digit) => digit + digit).join('')
    }
    const num = parseInt(color, 16)
    const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount))
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// ── Lifecycle ──────────────────────────────────────────────────────────────

const { data: initial } = await useAsyncData('route-detail', async () => {
    if (!route_id.value) return null
    await Promise.all([getRouteMetadata(), getAllRouteRatings()])
    return { metadata: metadata.value, reviews: reviews.value }
})

if (initial.value) {
    metadata.value = initial.value.metadata
    reviews.value = initial.value.reviews
}

if (!metadata.value) throw createError({ status: 404, fatal: true })

loading.value = false

onMounted(async () => {
    const hash = window.location.hash
    if (hash.startsWith('#comment-')) {
        targetCommentId.value = hash.slice('#comment-'.length)
        await nextTick()
        document
            .getElementById(`comment-${targetCommentId.value}`)
            ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }

    if (!route_id.value) return

    await subscribe('ratings', (event) => {
        if (event.record.route_id === route_id.value) {
            void getAllRouteRatings()
        }
    })
})
</script>

<style scoped>
.comment-card--target {
    outline: 2px solid rgb(var(--v-theme-success));
    outline-offset: 2px;
    animation: target-fade 3s ease-out forwards;
}

@keyframes target-fade {
    0%,
    60% {
        outline-color: rgb(var(--v-theme-success));
    }
    100% {
        outline-color: rgba(var(--v-theme-success), 0);
    }
}

@media (prefers-reduced-motion: reduce) {
    .comment-card--target {
        animation: none;
    }
}

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

/* Round hero corners on tablet */
@media (min-width: 600px) {
    .route-hero {
        border-radius: 0 0 16px 16px;
    }
}

@media (min-width: 960px) {
    .route-page {
        max-width: 1400px;
        padding: 24px 24px 0;
    }

    .route-layout {
        display: grid;
        grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
        grid-template-areas:
            'hero hero'
            'details reviews'
            '. reviews';
        grid-template-rows: auto auto 1fr;
        column-gap: 32px;
        align-items: start;
    }

    .route-layout__main {
        display: contents;
    }

    .route-hero {
        grid-area: hero;
        min-height: 220px;
        border-radius: 16px;
        padding: 28px 32px;
        justify-content: center;
    }

    .route-hero__content h1 {
        font-size: 2.5rem;
    }

    .route-hero__content > .d-flex.align-end {
        justify-content: flex-start !important;
        align-items: center !important;
        gap: 20px;
    }

    .route-hero__difficulty-badge {
        min-width: 72px;
        height: 72px;
        border-radius: 20px;
    }

    .route-hero__difficulty-text {
        font-size: 1.75rem;
    }

    .stats-card {
        grid-area: hero;
        align-self: center;
        justify-self: end;
        min-width: 320px;
        margin: 0 32px 0 0;
    }

    .route-details {
        grid-area: details;
        padding-top: 24px !important;
    }

    .route-layout__reviews {
        grid-area: reviews;
        padding-top: 24px;
    }
}

@media (min-width: 1400px) {
    .route-reviews-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
        column-gap: 16px;
        align-items: start;
    }
}

.route-hero__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
        to top,
        rgba(0, 0, 0, 0.45) 0%,
        rgba(0, 0, 0, 0.05) 60%,
        transparent 100%
    );
    pointer-events: none;
}

.route-hero__content {
    position: relative;
    z-index: 1;
}

.route-hero__difficulty-badge {
    border: 0;
    cursor: pointer;
    flex-direction: column;
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

.route-hero__difficulty-system {
    font-size: 0.65rem;
    font-weight: 600;
    line-height: 1;
    margin-top: 3px;
    opacity: 0.8;
}

.stats-card {
    position: relative;
    z-index: 2;
    background: rgb(var(--v-theme-surface));
}
</style>
