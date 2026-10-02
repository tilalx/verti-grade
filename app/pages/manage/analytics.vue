<template>
    <div class="analytics-page mx-auto w-full p-4">
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

        <div class="mb-3 grid grid-cols-12 gap-3">
            <div
                v-for="card in summaryCards"
                :key="card.key"
                class="col-span-6 md:col-span-4 xl:col-span-2 flex"
            >
                <AnalyticsStatsCard
                    class="w-full"
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
            </div>
        </div>

        <div class="mb-3 grid grid-cols-12 gap-3">
            <div class="col-span-12 lg:col-span-7 flex">
                <AnalyticsSection
                    :title="t('analytics.sections.grades')"
                    icon="i-lucide-chart-column"
                    color="info"
                    :loading="initialLoading"
                    :empty="!analytics?.gradeDistribution.length"
                >
                    <AnalyticsGradeChart
                        :grades="analytics!.gradeDistribution"
                        :types="analytics!.types"
                    />
                </AnalyticsSection>
            </div>
            <div class="col-span-12 lg:col-span-5 flex">
                <AnalyticsSection
                    :title="t('analytics.sections.gradeBalance')"
                    icon="i-lucide-scale"
                    color="warning"
                    :subtitle="t('analytics.hints.gradeBalance')"
                    :loading="initialLoading"
                    :empty="!hasGradeImbalance"
                    empty-icon="i-lucide-circle-check"
                    :empty-text="t('analytics.empty.gradeBalance')"
                >
                    <AnalyticsGradeBalanceChart
                        :grades="analytics!.gradeDistribution"
                    />
                </AnalyticsSection>
            </div>
        </div>

        <div class="mb-3 grid grid-cols-12 gap-3">
            <div class="col-span-12 lg:col-span-8 flex">
                <AnalyticsSection
                    :title="t('analytics.sections.activity')"
                    icon="i-lucide-chart-spline"
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
            </div>
            <div class="col-span-12 lg:col-span-4 flex">
                <AnalyticsSection
                    :title="t('analytics.sections.ratingDistribution')"
                    icon="i-lucide-star"
                    color="warning"
                    :loading="initialLoading"
                    :empty="!analytics?.summary.ratings.value"
                >
                    <AnalyticsRatingDistributionChart
                        :counts="analytics!.ratingDistribution"
                    />
                </AnalyticsSection>
            </div>
        </div>

        <div class="mb-3 grid grid-cols-12 gap-3">
            <div class="col-span-12 lg:col-span-7 flex">
                <AnalyticsSection
                    :title="t('analytics.sections.gradeFeedback')"
                    icon="i-lucide-target"
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
            </div>
            <div class="col-span-12 lg:col-span-5 flex">
                <AnalyticsSection
                    :title="t('analytics.sections.setters')"
                    icon="i-lucide-hard-hat"
                    color="warning"
                    testid="analytics-setters"
                    :loading="initialLoading"
                    :empty="!analytics?.setters.length"
                >
                    <AnalyticsSetterChart :setters="analytics!.setters" />
                </AnalyticsSection>
            </div>
        </div>

        <div class="mb-3 grid grid-cols-12 gap-3">
            <div class="col-span-12 lg:col-span-6 flex">
                <AnalyticsSection
                    :title="t('analytics.sections.ratedRoutes')"
                    icon="i-lucide-thumbs-up"
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
            </div>
            <div class="col-span-12 lg:col-span-6 flex">
                <AnalyticsSection
                    :title="t('analytics.sections.oldestActive')"
                    icon="i-lucide-history"
                    color="warning"
                    :subtitle="t('analytics.hints.oldestActive')"
                    :loading="initialLoading"
                    :empty="!analytics?.oldestActive.length"
                >
                    <AnalyticsAgeChart :routes="analytics!.oldestActive" />
                </AnalyticsSection>
            </div>
        </div>

        <div class="mb-3 grid grid-cols-12 gap-3">
            <div class="col-span-12 lg:col-span-8 flex">
                <AnalyticsSection
                    :title="t('analytics.sections.locationGrades')"
                    icon="i-lucide-map-pin"
                    color="info"
                    :loading="initialLoading"
                    :empty="!analytics?.locationGrades.length"
                >
                    <AnalyticsLocationGradeChart
                        :cells="analytics!.locationGrades"
                    />
                </AnalyticsSection>
            </div>
            <div class="col-span-12 lg:col-span-4 flex">
                <AnalyticsSection
                    :title="t('analytics.sections.latestComments')"
                    icon="i-lucide-messages-square"
                    color="secondary"
                    testid="analytics-latest-comments"
                    flush
                    :loading="initialLoading"
                    :empty="!analytics?.latestComments.length"
                    empty-icon="i-lucide-message-square-off"
                    :empty-text="t('analytics.empty.latestComments')"
                >
                    <ul class="comment-list py-1">
                        <li
                            v-for="comment in analytics!.latestComments"
                            :key="comment.id"
                        >
                            <component
                                :is="comment.routeId ? NuxtLink : 'div'"
                                :to="
                                    comment.routeId
                                        ? `/route?id=${comment.routeId}`
                                        : undefined
                                "
                                class="comment-item flex items-center gap-3 px-4 py-2"
                            >
                                <div class="min-w-0 flex-1">
                                    <div class="truncate text-sm font-medium">
                                        {{
                                            comment.routeName ||
                                            t('analytics.labels.unknown')
                                        }}
                                    </div>
                                    <div
                                        class="line-clamp-2 text-xs text-muted"
                                    >
                                        {{ comment.comment }}
                                    </div>
                                </div>
                                <div
                                    v-if="comment.rating !== null"
                                    class="flex shrink-0"
                                    role="img"
                                    :aria-label="`${comment.rating}/5`"
                                >
                                    <UIcon
                                        v-for="star in 5"
                                        :key="star"
                                        name="i-lucide-star"
                                        :class="[
                                            'size-3.5',
                                            star <= Math.round(comment.rating)
                                                ? 'fill-current text-warning'
                                                : 'text-dimmed',
                                        ]"
                                    />
                                </div>
                            </component>
                        </li>
                    </ul>
                </AnalyticsSection>
            </div>
        </div>

        <div class="mb-3 grid grid-cols-12 gap-3">
            <div class="col-span-12 flex">
                <AnalyticsSection
                    :title="t('analytics.sections.activityHeatmap')"
                    icon="i-lucide-calendar-days"
                    color="success"
                    :loading="initialLoading"
                    :empty="!analytics?.dailyRouteActivity.length"
                >
                    <AnalyticsActivityHeatmap
                        :timeline="analytics!.dailyRouteActivity"
                    />
                </AnalyticsSection>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { formatNumber } from '#shared/utils/number'
import type { TimelineDatum } from '#shared/utils/analytics'

definePageMeta({
    middleware: ['auth'],
    requiredPermission: 'view_analytics',
})

const { t, locale } = useI18n()
const NuxtLink = resolveComponent('NuxtLink')

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
            icon: 'i-lucide-flag-triangle-right',
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
            icon: 'i-lucide-waypoints',
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
            icon: 'i-lucide-star',
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
            icon: 'i-lucide-star-half',
            color: 'warning',
            format: (value: number) => formatNumber(value, locale.value, 2),
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
            icon: 'i-lucide-messages-square',
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
            icon: 'i-lucide-hourglass',
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

a.comment-item:hover {
    background: color-mix(in oklab, var(--ui-text-highlighted) 4%, transparent);
}

@media (max-width: 600px) {
    .analytics-page {
        padding-inline: 12px;
    }
}
</style>
