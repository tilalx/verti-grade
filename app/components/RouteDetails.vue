<template>
    <div class="view-ratings-wrapper">
        <v-btn
            color="primary"
            data-testid="route-details-open"
            @click="openSheet"
        >
            {{ $t('ratings.ratings') }}
        </v-btn>

        <LayoutDialogShell
            v-model="isSheetOpen"
            max-width="600"
            closable
            sheet-on-mobile
            :title="$t('ratings.climber_reviews')"
            data-testid="route-details-sheet"
        >
            <v-progress-linear v-if="isLoading" indeterminate color="primary" />

            <div v-if="!isLoading && reviews.length">
                <CommentsCard
                    v-for="review in reviews"
                    :key="review.id"
                    :comment="review"
                    date-format="relative"
                    class="mb-3"
                >
                    <template #actions>
                        <v-btn
                            icon="mdi-flag-outline"
                            variant="text"
                            size="small"
                            :aria-label="$t('reports.reportAction')"
                            :title="$t('reports.reportAction')"
                            data-testid="comment-card-report"
                            @click="openReport(review.id)"
                        />
                    </template>
                </CommentsCard>
            </div>

            <LayoutEmptyState
                v-if="!isLoading && !reviews.length"
                icon="mdi-star-shooting-outline"
                :card="false"
                :title="$t('ratings.no_reviews_yet')"
                :hint="$t('ratings.be_the_first')"
            />
        </LayoutDialogShell>

        <ReportsFormDialog
            v-if="reportTarget"
            v-model="reportDialog"
            content-type="rating"
            :content-id="reportTarget"
            :content-url="reportUrl"
        />
    </div>
</template>

<script setup lang="ts">
import type PocketBase from 'pocketbase'
import type { RatingRecord } from '~/types/models'
import type { CommentCardItem } from '~/components/comments/Card.vue'
import { formatGrade } from '#shared/utils/grades'
import { reportContentUrl } from '~/utils/reports'

const { t } = useI18n()

const props = defineProps<{
    route_id: string
}>()

const pb = usePocketbase() as PocketBase
const { subscribe, unsubscribeFrom } = usePbSubscription()
const { error: notifyError } = useNotification()

const isSheetOpen = ref(false)
const isLoading = ref(false)
const reviews = ref<CommentCardItem[]>([])

const reportDialog = ref(false)
const reportTarget = ref<string | null>(null)
const reportUrl = computed(() =>
    reportTarget.value
        ? reportContentUrl('rating', reportTarget.value, props.route_id)
        : '',
)

function openReport(id: string) {
    reportTarget.value = id
    reportDialog.value = true
}

const openSheet = async () => {
    isSheetOpen.value = true
    await fetchClimbingRatings()
    await subscribe('ratings', (e) => {
        if (e.record.route_id === props.route_id) {
            fetchClimbingRatings()
        }
    })
}

const fetchClimbingRatings = async () => {
    if (!props.route_id) {
        return
    }

    isLoading.value = true
    try {
        const data = await pb.collection('ratings').getFullList<RatingRecord>({
            filter: `route_id = "${props.route_id}"`,
            sort: '-created',
            expand: 'user',
        })

        reviews.value = data.map(mapReview)
    } catch (error) {
        console.error('Error fetching ratings:', error)
        reviews.value = []
        notifyError(t('ratings.loadError'))
    } finally {
        isLoading.value = false
    }
}

watch(isSheetOpen, (isOpen) => {
    if (!isOpen) void unsubscribeFrom('ratings')
})

function mapReview(
    r: RatingRecord & { expand?: Record<string, unknown> },
): CommentCardItem {
    const user = r.expand?.user as
        { name?: string; username?: string; avatar?: string } | undefined

    return {
        id: r.id,
        rating: typeof r.rating === 'number' ? r.rating : null,
        difficultyLabel: formatGrade(r),
        comment: r.comment ?? null,
        created: r.created ?? '',
        userName: user?.name || user?.username || t('comments.anonymous'),
        userAvatar: r.expand?.user
            ? usePbFileUrl(r.expand.user, user?.avatar, { thumb: '80x80' }) ||
              null
            : null,
    }
}
</script>
