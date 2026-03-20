<template>
    <v-container class="route-page px-3 py-4">

        <!-- ── Hero card ───────────────────────────────────────────────────── -->
        <v-card v-if="loading" rounded="xl" border flat class="mb-4">
            <v-skeleton-loader type="image" height="6" />
            <v-skeleton-loader type="article" class="pa-2" />
        </v-card>

        <v-card v-else-if="metadata" rounded="xl" border flat class="mb-4 overflow-hidden">
            <!-- Color stripe -->
            <v-sheet
                :color="metadata.color || 'primary'"
                height="6"
                rounded="0"
            />

            <v-card-text class="pt-4 pb-3">
                <!-- Type + location badges -->
                <div class="d-flex align-center flex-wrap ga-2 mb-3">
                    <v-chip
                        v-if="metadata.type"
                        size="small"
                        variant="tonal"
                        :prepend-icon="metadata.type === 'Boulder' ? 'mdi-image-filter-hdr' : 'mdi-routes'"
                    >
                        {{ metadata.type }}
                    </v-chip>
                    <v-chip
                        v-if="metadata.location"
                        size="small"
                        variant="tonal"
                        prepend-icon="mdi-map-marker-outline"
                    >
                        {{ metadata.location }}
                    </v-chip>
                </div>

                <!-- Route name -->
                <h1 class="text-h5 font-weight-bold mb-2" style="line-height:1.2">
                    {{ metadata.name }}
                </h1>

                <!-- Difficulty -->
                <div class="d-flex align-center ga-2 mb-4">
                    <v-chip
                        v-if="difficulty"
                        color="primary"
                        variant="flat"
                        size="small"
                        class="font-weight-bold"
                    >
                        {{ difficulty }}
                    </v-chip>
                    <span
                        v-if="metadata.anchor_point != null && metadata.type !== 'Boulder'"
                        class="text-caption text-medium-emphasis"
                    >
                        #{{ metadata.anchor_point }}
                    </span>
                </div>

                <!-- Meta: setter + date -->
                <div class="d-flex flex-column ga-1 mb-4">
                    <div v-if="metadata.creator?.length" class="d-flex align-center ga-2">
                        <v-icon size="16" color="medium-emphasis">mdi-account-hard-hat-outline</v-icon>
                        <span class="text-body-2 text-medium-emphasis">{{ metadata.creator.join(', ') }}</span>
                    </div>
                    <div v-if="formattedScrewDate" class="d-flex align-center ga-2">
                        <v-icon size="16" color="medium-emphasis">mdi-calendar-outline</v-icon>
                        <span class="text-body-2 text-medium-emphasis">{{ formattedScrewDate }}</span>
                    </div>
                    <div v-if="metadata.comment" class="d-flex align-start ga-2 mt-1">
                        <v-icon size="16" color="medium-emphasis" class="mt-1">mdi-information-outline</v-icon>
                        <span class="text-body-2 text-medium-emphasis font-italic">{{ metadata.comment }}</span>
                    </div>
                </div>

                <!-- Aggregate rating summary -->
                <v-divider class="mb-3" />
                <div class="d-flex align-center ga-4">
                    <div class="d-flex align-center ga-1">
                        <v-icon color="yellow-darken-2" size="20">mdi-star</v-icon>
                        <span class="text-body-1 font-weight-bold">{{ avgRating }}</span>
                        <span class="text-caption text-medium-emphasis ml-1">
                            ({{ reviews.length }} {{ t('ratings.climber_reviews') }})
                        </span>
                    </div>
                    <div v-if="avgPerceivedDifficulty" class="d-flex align-center ga-1">
                        <v-icon size="16" color="medium-emphasis">mdi-trending-up</v-icon>
                        <span class="text-caption text-medium-emphasis">{{ avgPerceivedDifficulty }}</span>
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <!-- ── Rate CTA ────────────────────────────────────────────────────── -->
        <ReviewFormDialog
            v-if="route_id"
            :route-id="route_id"
            call-to-action
            class="mb-6"
            @saved="onReviewSaved"
        />

        <!-- ── Reviews ─────────────────────────────────────────────────────── -->
        <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-subtitle-2 font-weight-semibold text-medium-emphasis">
                {{ t('ratings.climber_reviews') }}
                <span v-if="reviews.length" class="ml-1">({{ reviews.length }})</span>
            </span>
        </div>

        <!-- Skeleton loaders -->
        <div v-if="loading">
            <v-card v-for="i in 3" :key="i" rounded="xl" border flat class="mb-3">
                <v-skeleton-loader type="list-item-avatar-two-line" />
                <v-skeleton-loader type="sentences" class="px-4 pb-3" />
            </v-card>
        </div>

        <!-- Review list -->
        <template v-else-if="reviews.length">
            <v-card
                v-for="review in reviews"
                :key="review.id"
                rounded="xl"
                border
                flat
                class="mb-3"
            >
                <v-card-item class="pb-1 pt-3">
                    <template #prepend>
                        <v-avatar
                            size="36"
                            :color="review.userAvatar ? undefined : avatarColor(review.userName)"
                        >
                            <v-img v-if="review.userAvatar" :src="review.userAvatar" cover />
                            <span v-else class="text-caption font-weight-bold text-white">
                                {{ initials(review.userName) }}
                            </span>
                        </v-avatar>
                    </template>

                    <v-card-title class="text-body-2 font-weight-semibold px-0 py-0" style="line-height:1.3">
                        {{ review.userName }}
                    </v-card-title>
                    <v-card-subtitle class="text-caption px-0 py-0" style="opacity:.65">
                        {{ timeAgo(review.created) }}
                    </v-card-subtitle>

                    <template #append>
                        <div class="d-flex flex-column align-end ga-1">
                            <v-rating
                                :model-value="review.rating"
                                readonly
                                density="compact"
                                size="small"
                                active-color="yellow-darken-2"
                                color="grey-lighten-2"
                            />
                            <v-chip
                                v-if="review.difficulty"
                                size="x-small"
                                color="primary"
                                variant="tonal"
                            >
                                {{ review.difficulty }}
                            </v-chip>
                        </div>
                    </template>
                </v-card-item>

                <v-card-text v-if="review.comment" class="text-body-2 pt-1 pb-3">
                    {{ review.comment }}
                </v-card-text>
            </v-card>
        </template>

        <!-- Empty state -->
        <v-card v-else rounded="xl" border flat class="py-12 text-center">
            <v-icon size="52" color="grey-lighten-2" class="mb-3">mdi-star-outline</v-icon>
            <div class="text-h6 text-medium-emphasis">{{ t('ratings.no_reviews_yet') }}</div>
            <div class="text-body-2 text-disabled mt-1">{{ t('ratings.be_the_first') }}</div>
        </v-card>

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
    // Show the most commonly perceived difficulty grade
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
}
</style>
