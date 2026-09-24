<template>
    <v-container class="analytics-page">
        <LayoutPageHeader
            :title="t('analytics.title')"
            :subtitle="t('analytics.subtitle')"
            class="mb-6"
        />

        <AnalyticsFilters
            :query="query"
            :locations="locations ?? []"
            @update="updateQuery"
        />

        <v-row class="mb-2" density="comfortable">
            <v-col
                v-for="card in summaryCards"
                :key="card.key"
                cols="6"
                md="4"
                xl="2"
                class="d-flex"
            >
                <AnalyticsStatsCard
                    class="w-100"
                    :data-testid="`analytics-stat-${card.key}`"
                    :title="t(`analytics.cards.${card.key}`)"
                    :subtitle="card.subtitle"
                    :value="card.value"
                    :previous="card.previous"
                    :icon="card.icon"
                    :color="card.color"
                    :format="card.format"
                    :spark="card.spark"
                    :meter="card.meter"
                    :loading="initialLoading"
                />
            </v-col>
        </v-row>

        <v-row class="mb-2" density="comfortable">
            <v-col cols="12" lg="7" class="d-flex">
                <AnalyticsSection
                    :title="t('analytics.sections.grades')"
                    icon="mdi-chart-bar"
                    color="info"
                    :loading="initialLoading"
                    :empty="!analytics?.gradeDistribution.length"
                >
                    <AnalyticsGradeChart
                        :grades="analytics!.gradeDistribution"
                        :types="analytics!.types"
                    />
                </AnalyticsSection>
            </v-col>
            <v-col cols="12" lg="5" class="d-flex">
                <AnalyticsSection
                    :title="t('analytics.sections.gradeBalance')"
                    icon="mdi-scale-unbalanced"
                    color="warning"
                    :subtitle="t('analytics.hints.gradeBalance')"
                    :loading="initialLoading"
                    :empty="!hasGradeImbalance"
                    empty-icon="mdi-check-circle-outline"
                    :empty-text="t('analytics.empty.gradeBalance')"
                >
                    <AnalyticsGradeBalanceChart
                        :grades="analytics!.gradeDistribution"
                    />
                </AnalyticsSection>
            </v-col>
        </v-row>

        <v-row class="mb-2" density="comfortable">
            <v-col cols="12" lg="8" class="d-flex">
                <AnalyticsSection
                    :title="t('analytics.sections.activity')"
                    icon="mdi-chart-timeline-variant"
                    color="success"
                    :loading="initialLoading"
                    :empty="!hasActivity"
                >
                    <AnalyticsActivityChart
                        :routes="analytics!.routeTimeline"
                        :ratings="analytics!.ratingTimeline"
                        :bucket="analytics!.bucket"
                    />
                </AnalyticsSection>
            </v-col>
            <v-col cols="12" lg="4" class="d-flex">
                <AnalyticsSection
                    :title="t('analytics.sections.ratingDistribution')"
                    icon="mdi-star-outline"
                    color="warning"
                    :loading="initialLoading"
                    :empty="!analytics?.summary.ratings.value"
                >
                    <AnalyticsRatingDistributionChart
                        :counts="analytics!.ratingDistribution"
                    />
                </AnalyticsSection>
            </v-col>
        </v-row>

        <v-row class="mb-2" density="comfortable">
            <v-col cols="12" lg="7" class="d-flex">
                <AnalyticsSection
                    :title="t('analytics.sections.gradeFeedback')"
                    icon="mdi-target"
                    color="error"
                    :subtitle="t('analytics.hints.gradeFeedback')"
                    :loading="initialLoading"
                    :empty="!analytics?.gradeFeedback.length"
                    :empty-text="t('analytics.empty.gradeFeedback')"
                >
                    <AnalyticsGradeFeedbackChart
                        :routes="analytics!.gradeFeedback"
                    />
                </AnalyticsSection>
            </v-col>
            <v-col cols="12" lg="5" class="d-flex">
                <AnalyticsSection
                    :title="t('analytics.sections.setters')"
                    icon="mdi-account-hard-hat-outline"
                    color="warning"
                    testid="analytics-setters"
                    :loading="initialLoading"
                    :empty="!analytics?.setters.length"
                >
                    <AnalyticsSetterChart :setters="analytics!.setters" />
                </AnalyticsSection>
            </v-col>
        </v-row>

        <v-row class="mb-2" density="comfortable">
            <v-col cols="12" lg="6" class="d-flex">
                <AnalyticsSection
                    :title="t('analytics.sections.ratedRoutes')"
                    icon="mdi-thumbs-up-down-outline"
                    color="success"
                    :subtitle="t('analytics.hints.ratedRoutes')"
                    :loading="initialLoading"
                    :empty="!analytics?.topRated.length"
                    :empty-text="t('analytics.empty.ratedRoutes')"
                >
                    <AnalyticsRatingChart
                        :top="analytics!.topRated"
                        :lowest="analytics!.lowestRated"
                        :baseline="analytics!.ratingBaseline ?? 0"
                    />
                </AnalyticsSection>
            </v-col>
            <v-col cols="12" lg="6" class="d-flex">
                <AnalyticsSection
                    :title="t('analytics.sections.oldestActive')"
                    icon="mdi-history"
                    color="warning"
                    :subtitle="t('analytics.hints.oldestActive')"
                    :loading="initialLoading"
                    :empty="!analytics?.oldestActive.length"
                >
                    <AnalyticsAgeChart :routes="analytics!.oldestActive" />
                </AnalyticsSection>
            </v-col>
        </v-row>

        <v-row class="mb-2" density="comfortable">
            <v-col cols="12" lg="8" class="d-flex">
                <AnalyticsSection
                    :title="t('analytics.sections.locationGrades')"
                    icon="mdi-map-marker-outline"
                    color="info"
                    :loading="initialLoading"
                    :empty="!analytics?.locationGrades.length"
                >
                    <AnalyticsLocationGradeChart
                        :cells="analytics!.locationGrades"
                    />
                </AnalyticsSection>
            </v-col>
            <v-col cols="12" lg="4" class="d-flex">
                <AnalyticsSection
                    :title="t('analytics.sections.latestComments')"
                    icon="mdi-comment-text-multiple-outline"
                    color="secondary"
                    testid="analytics-latest-comments"
                    flush
                    :loading="initialLoading"
                    :empty="!analytics?.latestComments.length"
                    empty-icon="mdi-comment-off-outline"
                    :empty-text="t('analytics.empty.latestComments')"
                >
                    <v-list
                        lines="two"
                        density="compact"
                        class="comment-list py-1"
                    >
                        <v-list-item
                            v-for="comment in analytics!.latestComments"
                            :key="comment.id"
                            :to="
                                comment.routeId
                                    ? `/route?id=${comment.routeId}`
                                    : undefined
                            "
                            :title="
                                comment.routeName ||
                                t('analytics.labels.unknown')
                            "
                            :subtitle="comment.comment"
                        >
                            <template #append>
                                <v-rating
                                    v-if="comment.rating !== null"
                                    :model-value="comment.rating"
                                    readonly
                                    density="compact"
                                    size="14"
                                    color="warning"
                                    class="comment-rating"
                                />
                            </template>
                        </v-list-item>
                    </v-list>
                </AnalyticsSection>
            </v-col>
        </v-row>

        <v-row class="mb-2" density="comfortable">
            <v-col cols="12" class="d-flex">
                <AnalyticsSection
                    :title="t('analytics.sections.activityHeatmap')"
                    icon="mdi-calendar-month-outline"
                    color="success"
                    :loading="initialLoading"
                    :empty="!analytics?.dailyRouteActivity.length"
                >
                    <AnalyticsActivityHeatmap
                        :timeline="analytics!.dailyRouteActivity"
                    />
                </AnalyticsSection>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import type { TimelineDatum } from '#shared/utils/analytics'

definePageMeta({
    middleware: ['auth'],
    requiredPermission: 'view_analytics',
})

const { t, locale } = useI18n()

useHead(() => ({
    title: t('analytics.meta.title'),
    meta: [{ name: 'description', content: t('analytics.meta.description') }],
}))

const { query, updateQuery, analytics, initialLoading, error } =
    useClimbingAnalytics()
const { data: locations } = useLocations()
const { error: notifyError } = useNotification()

watch(
    error,
    (hasError) => {
        if (hasError) notifyError(t('analytics.error'))
    },
    { immediate: true },
)

const hasActivity = computed(() =>
    [
        ...(analytics.value?.routeTimeline ?? []),
        ...(analytics.value?.ratingTimeline ?? []),
    ].some((entry) => entry.count > 0),
)

const hasGradeImbalance = computed(() =>
    (analytics.value?.gradeDistribution ?? []).some(
        (row) => row.grade !== '?' && Math.abs(row.total - row.expected) >= 0.5,
    ),
)

const formatCount = (value: number) => `${value}`
const counts = (timeline: TimelineDatum[] | undefined) =>
    (timeline ?? []).map((entry) => entry.count)

const summaryCards = computed(() => {
    const data = analytics.value
    const summary = data?.summary
    const activeRoutes = summary?.activeRoutes ?? 0
    const ratedRoutes = activeRoutes - (summary?.unratedRoutes ?? 0)
    return [
        {
            key: 'activeRoutes',
            value: activeRoutes,
            previous: null,
            icon: 'mdi-flag-checkered',
            color: 'info',
            format: formatCount,
            spark: [],
            meter: activeRoutes ? ratedRoutes / activeRoutes : null,
            subtitle: t('analytics.cards.activeRoutesSubtitle', {
                n: ratedRoutes,
            }),
        },
        {
            key: 'routesSet',
            value: summary?.routesSet.value ?? 0,
            previous: summary?.routesSet.previous ?? null,
            icon: 'mdi-map-marker-path',
            color: 'success',
            format: formatCount,
            spark: counts(data?.routeTimeline),
            meter: null,
            subtitle: t('analytics.cards.routesSetSubtitle'),
        },
        {
            key: 'ratings',
            value: summary?.ratings.value ?? 0,
            previous: summary?.ratings.previous ?? null,
            icon: 'mdi-star-outline',
            color: 'warning',
            format: formatCount,
            spark: counts(data?.ratingTimeline),
            meter: null,
            subtitle: t('analytics.cards.ratingsSubtitle'),
        },
        {
            key: 'averageRating',
            value: summary?.ratings.value ? summary.averageRating.value : null,
            previous: summary?.averageRating.previous ?? null,
            icon: 'mdi-star-half-full',
            color: 'warning',
            format: (value: number) => value.toFixed(2),
            spark: [],
            meter: summary?.ratings.value
                ? summary.averageRating.value / 5
                : null,
            subtitle: t('analytics.cards.averageRatingSubtitle'),
        },
        {
            key: 'comments',
            value: summary?.comments.value ?? 0,
            previous: summary?.comments.previous ?? null,
            icon: 'mdi-comment-text-multiple-outline',
            color: 'secondary',
            format: formatCount,
            spark: counts(data?.commentTimeline),
            meter: null,
            subtitle: t('analytics.cards.commentsSubtitle'),
        },
        {
            key: 'averageLifespan',
            value: summary?.averageLifespanDays ?? null,
            previous: null,
            icon: 'mdi-timer-sand',
            color: 'error',
            format: (value: number) => t('analytics.labels.days', { n: value }),
            spark: [],
            meter: null,
            subtitle: t('analytics.cards.averageLifespanSubtitle'),
        },
    ]
})
</script>

<style scoped>
.comment-list {
    overflow: hidden;
}

.comment-list :deep(.v-list-item) {
    grid-template-columns: max-content minmax(0, 1fr) auto;
}

.comment-rating :deep(.v-btn) {
    width: 16px;
    height: 16px;
}

@media (max-width: 600px) {
    .analytics-page {
        padding-inline: 12px;
    }
}
</style>
