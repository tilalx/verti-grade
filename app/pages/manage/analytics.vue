<template>
    <v-container class="analytics-page">
        <LayoutPageHeader
            :title="t('analytics.title')"
            :subtitle="t('analytics.subtitle')"
            class="mb-6"
        >
            <template #actions>
                <div v-if="summary.generatedAt" class="generated-at">
                    {{
                        t('analytics.generatedAt', {
                            value: formatAnalyticsDate(summary.generatedAt),
                        })
                    }}
                </div>
                <v-btn
                    color="primary"
                    prepend-icon="mdi-refresh"
                    :loading="loading"
                    data-testid="analytics-refresh"
                    @click="refresh"
                >
                    {{ t('analytics.refresh') }}
                </v-btn>
            </template>
        </LayoutPageHeader>

        <!-- ── Summary cards ──────────────────────────────────────────── -->
        <v-row class="mb-6" density="comfortable">
            <v-col
                v-for="card in summaryCards"
                :key="card.key"
                cols="12"
                sm="6"
                md="3"
                class="d-flex"
            >
                <AnalyticsStatsCard
                    class="w-100"
                    :data-testid="`analytics-stat-${card.key}`"
                    :title="card.title"
                    :value="card.value"
                    :icon="card.icon"
                    :accent-color="card.accentColor"
                    :icon-bg="card.iconBg"
                    :icon-fg="card.iconFg"
                    :subtitle="card.subtitle"
                    :loading="loading"
                    :format="card.format"
                />
            </v-col>
        </v-row>

        <!-- ── Latest activity ────────────────────────────────────────── -->
        <v-row class="mb-6" density="comfortable">
            <!-- Latest comments -->
            <v-col cols="12" md="6" class="d-flex">
                <v-card class="analytics-card surface-card w-100" elevation="0">
                    <v-card-title class="card-header">
                        <div
                            class="card-header-icon"
                            style="background: #eeedfe"
                        >
                            <v-icon size="16" color="#534AB7"
                                >mdi-comment-text-multiple-outline</v-icon
                            >
                        </div>
                        <span class="card-header-title">{{
                            t('analytics.sections.latestComments')
                        }}</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="pa-0">
                        <v-skeleton-loader
                            v-if="loading"
                            :type="[
                                'list-item-two-line',
                                'list-item-two-line',
                                'list-item-two-line',
                            ]"
                            class="px-4 py-2"
                        />
                        <LayoutEmptyState
                            v-else-if="!hasLatestComments"
                            icon="mdi-comment-off-outline"
                            :card="false"
                            :title="t('analytics.emptyComments')"
                        />
                        <v-list v-else lines="two" class="py-1">
                            <v-list-item
                                v-for="comment in latestComments"
                                :key="comment.id"
                                class="comment-item"
                            >
                                <template #prepend>
                                    <div class="comment-avatar">
                                        {{
                                            (comment.routeName || '?')
                                                .charAt(0)
                                                .toUpperCase()
                                        }}
                                    </div>
                                </template>
                                <v-list-item-title class="item-title">
                                    {{
                                        comment.routeName ||
                                        t('analytics.labels.unknown')
                                    }}
                                </v-list-item-title>
                                <v-list-item-subtitle class="item-sub">
                                    {{ comment.comment }}
                                </v-list-item-subtitle>
                                <template #append>
                                    <div
                                        class="d-flex flex-column align-end ga-1"
                                    >
                                        <div
                                            v-if="comment.rating !== null"
                                            class="rating-badge"
                                        >
                                            <v-icon size="12" color="warning"
                                                >mdi-star</v-icon
                                            >
                                            <span>{{
                                                formatRating(comment.rating)
                                            }}</span>
                                        </div>
                                        <span class="time-label">{{
                                            formatAnalyticsDate(comment.created)
                                        }}</span>
                                    </div>
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Latest routes -->
            <v-col cols="12" md="6" class="d-flex">
                <v-card class="analytics-card surface-card w-100" elevation="0">
                    <v-card-title class="card-header">
                        <div
                            class="card-header-icon"
                            style="background: #e1f5ee"
                        >
                            <v-icon size="16" color="#0F6E56"
                                >mdi-map-marker-path</v-icon
                            >
                        </div>
                        <span class="card-header-title">{{
                            t('analytics.sections.latestRoutes')
                        }}</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="pa-0">
                        <v-skeleton-loader
                            v-if="loading"
                            :type="[
                                'list-item-two-line',
                                'list-item-two-line',
                                'list-item-two-line',
                            ]"
                            class="px-4 py-2"
                        />
                        <LayoutEmptyState
                            v-else-if="!hasLatestRoutes"
                            icon="mdi-routes"
                            :card="false"
                            :title="t('analytics.emptyRoutes')"
                        />
                        <v-list v-else lines="two" class="py-1">
                            <v-list-item
                                v-for="route in latestRoutes"
                                :key="route.id"
                                class="comment-item"
                            >
                                <template #prepend>
                                    <div class="route-avatar">
                                        <v-icon size="16" color="#0F6E56"
                                            >mdi-routes</v-icon
                                        >
                                    </div>
                                </template>
                                <v-list-item-title class="item-title">
                                    {{
                                        route.name ||
                                        t('analytics.labels.unknown')
                                    }}
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    <div class="route-chips">
                                        <span
                                            v-if="route.difficulty"
                                            class="route-chip chip-difficulty"
                                        >
                                            <v-icon size="10"
                                                >mdi-tag-outline</v-icon
                                            >
                                            {{ route.difficulty }}
                                        </span>
                                        <span
                                            v-if="route.location"
                                            class="route-chip chip-location"
                                        >
                                            <v-icon size="10"
                                                >mdi-map-marker-outline</v-icon
                                            >
                                            {{ route.location }}
                                        </span>
                                        <span
                                            v-if="route.creators?.length"
                                            class="route-chip chip-setter"
                                        >
                                            <v-icon size="10"
                                                >mdi-account-hard-hat-outline</v-icon
                                            >
                                            {{ formatCreators(route.creators) }}
                                        </span>
                                    </div>
                                </v-list-item-subtitle>
                                <template #append>
                                    <span class="time-label">{{
                                        formatAnalyticsDate(route.screwDate)
                                    }}</span>
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- ── Charts row 1: difficulty + route timeline ──────────────── -->
        <v-row class="mb-6" density="comfortable">
            <v-col cols="12" md="6" class="d-flex">
                <v-card class="analytics-card surface-card w-100" elevation="0">
                    <v-card-title class="card-header">
                        <div
                            class="card-header-icon"
                            style="background: #e6f1fb"
                        >
                            <v-icon size="16" color="#185FA5"
                                >mdi-chart-bar</v-icon
                            >
                        </div>
                        <span class="card-header-title">{{
                            t('analytics.charts.difficultyDistribution')
                        }}</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <v-skeleton-loader
                            v-if="loading"
                            type="image"
                            class="chart-skeleton"
                        />
                        <AnalyticsBaseEchart
                            v-else-if="hasData"
                            :option="difficultyOption"
                            :height="340"
                            testid="analytics-chart-difficulty"
                        />
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="6" class="d-flex">
                <v-card class="analytics-card surface-card w-100" elevation="0">
                    <v-card-title class="card-header">
                        <div
                            class="card-header-icon"
                            style="background: #e1f5ee"
                        >
                            <v-icon size="16" color="#0F6E56"
                                >mdi-chart-timeline-variant</v-icon
                            >
                        </div>
                        <span class="card-header-title">{{
                            t('analytics.charts.routeTimeline')
                        }}</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <v-skeleton-loader
                            v-if="loading"
                            type="image"
                            class="chart-skeleton"
                        />
                        <AnalyticsBaseEchart
                            v-else-if="hasData"
                            :option="routeTimelineOption"
                            :height="340"
                            testid="analytics-chart-route-timeline"
                        />
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- ── Activity heatmap ───────────────────────────────────────── -->
        <v-row v-if="!error" class="mb-6" density="comfortable">
            <v-col cols="12" class="d-flex">
                <v-card class="analytics-card surface-card w-100" elevation="0">
                    <v-card-title class="card-header">
                        <div
                            class="card-header-icon"
                            style="background: #e1f5ee"
                        >
                            <v-icon size="16" color="#0F6E56"
                                >mdi-calendar-month-outline</v-icon
                            >
                        </div>
                        <span class="card-header-title">{{
                            t('analytics.charts.activityHeatmap')
                        }}</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="heatmap-wrapper">
                        <v-skeleton-loader
                            v-if="loading"
                            type="image"
                            class="chart-skeleton"
                        />
                        <AnalyticsActivityHeatmap
                            v-else-if="hasData"
                            :timeline="routeTimeline"
                        />
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- ── Charts row 2: setters + comment timeline ───────────────── -->
        <v-row density="comfortable">
            <v-col cols="12" md="6" class="d-flex">
                <v-card class="analytics-card surface-card w-100" elevation="0">
                    <v-card-title class="card-header">
                        <div
                            class="card-header-icon"
                            style="background: #faeeda"
                        >
                            <v-icon size="16" color="#854F0B"
                                >mdi-account-hard-hat-outline</v-icon
                            >
                        </div>
                        <span class="card-header-title">{{
                            t('analytics.charts.routeSetters')
                        }}</span>
                        <v-spacer />
                        <v-switch
                            v-model="showAllSetters"
                            color="primary"
                            density="compact"
                            hide-details
                            inset
                            :label="t('analytics.actions.showAllSetters')"
                            class="setter-switch"
                            data-testid="analytics-show-all-setters"
                        />
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <v-skeleton-loader
                            v-if="loading"
                            type="image"
                            class="chart-skeleton"
                        />
                        <AnalyticsBaseEchart
                            v-else-if="hasData"
                            :option="routeSettersOption"
                            :height="340"
                            testid="analytics-chart-route-setters"
                        />
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="6" class="d-flex">
                <v-card class="analytics-card surface-card w-100" elevation="0">
                    <v-card-title class="card-header">
                        <div
                            class="card-header-icon"
                            style="background: #eeedfe"
                        >
                            <v-icon size="16" color="#534AB7"
                                >mdi-message-text-clock-outline</v-icon
                            >
                        </div>
                        <span class="card-header-title">{{
                            t('analytics.charts.commentTimeline')
                        }}</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <v-skeleton-loader
                            v-if="loading"
                            type="image"
                            class="chart-skeleton"
                        />
                        <AnalyticsBaseEchart
                            v-else-if="hasData"
                            :option="commentTimelineOption"
                            :height="340"
                            testid="analytics-chart-comment-timeline"
                        />
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { formatDate } from '#shared/utils/formatting'
import {
    SETTER_COLORS,
    buildTooltip,
    formatMonthLabel,
    gridBase,
    makeBarSeries,
    makeXAxis,
    niceAxis,
    readChartColors,
    tooltipBase,
    yAxisBase,
} from '~/utils/echarts'
import type { TimelineDatum } from '~/composables/useClimbingAnalytics'

interface AxisTooltipParam {
    name: string
    value: number
}

const { t, locale } = useI18n()
const theme = useTheme()

useHead(() => ({
    title: t('analytics.meta.title'),
    meta: [{ name: 'description', content: t('analytics.meta.description') }],
}))

definePageMeta({
    middleware: ['auth'],
    requiredPermission: 'view_analytics',
})

const {
    summary,
    difficultyDistribution,
    routeSetters,
    routeTimeline,
    routeTimelineMonthly,
    commentTimelineMonthly,
    latestComments,
    latestRoutes,
    hasData,
    loading,
    error,
    refresh,
} = useClimbingAnalytics()

const { error: notifyError } = useNotification()

watch(
    error,
    (hasError) => {
        if (hasError) notifyError(t('analytics.error'))
    },
    { immediate: true },
)

const showAllSetters = ref(false)

const summaryCards = computed(() => [
    {
        key: 'totalRoutes',
        title: t('analytics.cards.totalRoutes'),
        value: summary.value.totalRoutes,
        icon: 'mdi-map-marker-path',
        accentColor: '#1D9E75',
        iconBg: '#E1F5EE',
        iconFg: '#1D9E75',
        subtitle: t('analytics.cards.totalRoutesSubtitle'),
        format: (value: number) => `${value}`,
    },
    {
        key: 'activeRoutes',
        title: t('analytics.cards.activeRoutes'),
        value: summary.value.activeRoutes,
        icon: 'mdi-flag-checkered',
        accentColor: '#378ADD',
        iconBg: '#E6F1FB',
        iconFg: '#378ADD',
        subtitle: t('analytics.cards.activeRoutesSubtitle'),
        format: (value: number) => `${value}`,
    },
    {
        key: 'averageDifficulty',
        title: t('analytics.cards.averageDifficulty'),
        value: summary.value.averageDifficulty,
        icon: 'mdi-summit',
        accentColor: '#EF9F27',
        iconBg: '#FAEEDA',
        iconFg: '#BA7517',
        subtitle: t('analytics.cards.averageDifficultySubtitle'),
        format: (value: number) => Number(value).toFixed(2),
    },
    {
        key: 'totalComments',
        title: t('analytics.cards.totalComments'),
        value: summary.value.totalComments,
        icon: 'mdi-comment-text-multiple-outline',
        accentColor: '#7F77DD',
        iconBg: '#EEEDFE',
        iconFg: '#534AB7',
        subtitle: t('analytics.cards.totalCommentsSubtitle'),
        format: (value: number) => `${value}`,
    },
    {
        key: 'averageLifespanDays',
        title: t('analytics.cards.averageLifespan'),
        value: summary.value.averageLifespanDays,
        icon: 'mdi-timer-sand',
        accentColor: '#D85A30',
        iconBg: '#FDEBD8',
        iconFg: '#D85A30',
        subtitle: t('analytics.cards.averageLifespanSubtitle'),
        format: (value: number) => `${value}d`,
    },
])

const hasLatestComments = computed(() => latestComments.value.length > 0)
const hasLatestRoutes = computed(() => latestRoutes.value.length > 0)

const chartColors = computed(() =>
    readChartColors(theme.global.current.value.dark),
)

function barChartOption(
    labels: string[],
    values: number[],
    seriesName: string,
    unit: string,
    color: string,
    emphasisColor: string,
) {
    const colors = chartColors.value
    return {
        backgroundColor: 'transparent',
        tooltip: {
            ...tooltipBase(colors),
            formatter: (params: AxisTooltipParam[]) =>
                buildTooltip(colors, params[0]!.name, params[0]!.value, unit),
        },
        grid: gridBase,
        xAxis: makeXAxis(colors, labels),
        yAxis: yAxisBase(colors),
        series: [makeBarSeries(seriesName, values, color, emphasisColor)],
        animationEasing: 'cubicOut',
    }
}

function monthlySeries(timeline: TimelineDatum[]) {
    return {
        labels: timeline.map((item) =>
            formatMonthLabel(item.period, locale.value),
        ),
        values: timeline.map((item) => item.count),
    }
}

const difficultyOption = computed(() =>
    barChartOption(
        difficultyDistribution.value.map((item) => item.grade),
        difficultyDistribution.value.map((item) => item.count),
        t('analytics.charts.difficultyDistribution'),
        t('analytics.labels.routes'),
        '#378ADD',
        '#85B7EB',
    ),
)

const routeTimelineOption = computed(() => {
    const { labels, values } = monthlySeries(routeTimelineMonthly.value)
    return barChartOption(
        labels,
        values,
        t('analytics.charts.routeTimeline'),
        t('analytics.labels.routes'),
        '#1D9E75',
        '#5DCAA5',
    )
})

const commentTimelineOption = computed(() => {
    const { labels, values } = monthlySeries(commentTimelineMonthly.value)
    const option = barChartOption(
        labels,
        values,
        t('analytics.labels.comments'),
        t('analytics.labels.comments'),
        '#7F77DD',
        '#AFA9EC',
    )
    return { ...option, yAxis: { ...option.yAxis, ...niceAxis(values) } }
})

const routeSettersData = computed(() => {
    const unknownLabel = t('analytics.labels.unknown')
    const sorted = routeSetters.value
        .map((item) => ({
            name: item.setter?.trim() || unknownLabel,
            value: item.count,
        }))
        .sort((a, b) => b.value - a.value)

    if (showAllSetters.value) return sorted

    const kept = sorted.filter((item) => item.value > 1)
    const otherCount = sorted
        .filter((item) => item.value <= 1)
        .reduce((sum, item) => sum + item.value, 0)
    return otherCount > 0
        ? [...kept, { name: t('analytics.labels.other'), value: otherCount }]
        : kept
})

const routeSettersOption = computed(() => {
    const { tooltipBg, tooltipText, tooltipMuted, tooltipBorder, labelColor } =
        chartColors.value
    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            formatter: ({
                name,
                value,
                percent,
            }: {
                name: string
                value: number
                percent: number
            }) =>
                `<span style="font-size:13px;color:${tooltipMuted}">${name}</span><br/>
                 <span style="font-weight:600;font-size:15px;color:${tooltipText}">${value} ${t('analytics.labels.routes')}</span>
                 <span style="font-size:12px;color:${tooltipMuted};margin-left:4px">(${percent}%)</span>`,
            backgroundColor: tooltipBg,
            borderColor: tooltipBorder,
            borderWidth: 1,
            textStyle: { color: tooltipText },
            extraCssText:
                'border-radius:10px;padding:10px 14px;box-shadow:0 4px 16px rgba(0,0,0,0.12)',
        },
        legend: {
            type: 'scroll',
            orient: 'vertical',
            right: 0,
            top: 'middle',
            itemWidth: 10,
            itemHeight: 10,
            itemGap: 8,
            icon: 'circle',
            textStyle: { fontSize: 11, color: labelColor },
            formatter: (name: string) => {
                const item = routeSettersData.value.find((d) => d.name === name)
                return item ? `${name}  (${item.value})` : name
            },
            pageIconColor: labelColor,
            pageIconInactiveColor: tooltipMuted,
            pageTextStyle: { color: labelColor, fontSize: 11 },
        },
        series: [
            {
                name: t('analytics.charts.routeSetters'),
                type: 'pie',
                radius: ['28%', '72%'],
                center: ['35%', '50%'],
                roseType: 'radius',
                itemStyle: {
                    borderColor: tooltipBg,
                    borderWidth: 1.5,
                    borderRadius: 3,
                },
                label: { show: false },
                labelLine: { show: false },
                emphasis: {
                    itemStyle: { borderWidth: 0 },
                    label: {
                        show: true,
                        position: 'center',
                        formatter: '{b}\n{c}',
                        fontSize: 13,
                        fontWeight: 600,
                        color: tooltipText,
                    },
                    scale: true,
                    scaleSize: 6,
                },
                data: routeSettersData.value,
            },
        ],
        color: SETTER_COLORS,
    }
})

function formatAnalyticsDate(value: string | null | undefined) {
    const hasTime = typeof value === 'string' && value.includes('T')
    return formatDate(value, {
        locale: locale.value,
        fallback: t('analytics.labels.unknown'),
        withTime: hasTime,
        dateStyle: 'medium',
        ...(hasTime ? { timeStyle: 'short' } : {}),
    })
}

function formatRating(value: number | null) {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric.toFixed(1) : ''
}

function formatCreators(creators: string[]) {
    return creators.length > 0
        ? creators.join(', ')
        : t('analytics.labels.unknown')
}
</script>

<style scoped>
.analytics-page {
    background: rgb(var(--v-theme-background));
}

.generated-at {
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-background), 0.4);
}

/* ── Shared card shell ───────────────────────────────────────────────── */
.analytics-card {
    transition: box-shadow 0.18s ease;
}

.analytics-card:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.07) !important;
}

/* ── Card header ─────────────────────────────────────────────────────── */
.card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px !important;
    font-size: 0.85rem !important;
    min-height: unset !important;
}

.card-header-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.card-header-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
}

/* ── List items ──────────────────────────────────────────────────────── */
.comment-item {
    padding: 10px 16px !important;
    min-height: unset !important;
}

.comment-item + .comment-item {
    border-top: 0.5px solid rgba(var(--v-theme-on-surface), 0.06);
}

.comment-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(var(--v-theme-primary), 0.12);
    color: rgb(var(--v-theme-primary));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    margin-right: 12px;
    flex-shrink: 0;
}

.route-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e1f5ee;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    flex-shrink: 0;
}

.item-title {
    font-size: 0.835rem !important;
    font-weight: 600 !important;
    color: rgb(var(--v-theme-on-surface)) !important;
    margin-bottom: 2px;
}

.item-sub {
    font-size: 0.78rem !important;
    opacity: 0.6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 240px;
}

/* ── Route chips ─────────────────────────────────────────────────────── */
.route-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
}

.route-chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 500;
    padding: 2px 7px;
    border-radius: 20px;
    line-height: 1.6;
}

.chip-difficulty {
    background: #e6f1fb;
    color: #185fa5;
}
.chip-location {
    background: #e1f5ee;
    color: #0f6e56;
}
.chip-setter {
    background: #faeeda;
    color: #854f0b;
}

/* ── Badges ──────────────────────────────────────────────────────────── */
.rating-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
    background: rgba(var(--v-theme-on-surface), 0.06);
    padding: 2px 6px;
    border-radius: 20px;
}

.time-label {
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.4);
    white-space: nowrap;
}

/* ── Misc ────────────────────────────────────────────────────────────── */
.chart-skeleton {
    height: 300px;
}

.setter-switch {
    font-size: 12px;
    flex-shrink: 0;
}

@media (max-width: 600px) {
    .analytics-page {
        padding-inline: 12px;
    }
}
</style>
