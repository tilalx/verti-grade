<template>
    <v-container fluid class="analytics-page py-6">

        <!-- ── Header ─────────────────────────────────────────────────── -->
        <v-row class="mb-6">
            <v-col
                cols="12"
                class="d-flex flex-column flex-sm-row align-sm-center justify-space-between gap-4"
            >
                <div>
                    <h1 class="page-title mb-1">
                        {{ t('analytics.title') }}
                    </h1>
                    <p class="page-subtitle mb-0">
                        {{ t('analytics.subtitle') }}
                    </p>
                </div>
                <div class="d-flex align-center gap-3">
                    <div v-if="summary.generatedAt" class="generated-at">
                        {{ t('analytics.generatedAt', { value: formatDate(summary.generatedAt) }) }}
                    </div>
                    <v-btn
                        color="primary"
                        variant="flat"
                        rounded="lg"
                        :loading="loading"
                        @click="refresh"
                    >
                        <v-icon start size="18">mdi-refresh</v-icon>
                        {{ t('analytics.refresh') }}
                    </v-btn>
                </div>
            </v-col>
        </v-row>

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
                <StatsCard
                    class="w-100"
                    :title="card.title"
                    :value="card.value"
                    :icon="card.icon"
                    :accent-color="card.accentColor"
                    :icon-bg="card.iconBg"
                    :icon-fg="card.iconFg"
                    :delta="card.delta"
                    :sparkline="card.sparkline"
                    :subtitle="card.subtitle"
                    :loading="loading"
                    :format="card.format"
                />
            </v-col>
        </v-row>

        <!-- ── Error banner ───────────────────────────────────────────── -->
        <v-row v-if="error" class="mb-4">
            <v-col cols="12">
                <v-alert type="error" variant="tonal" border="start" rounded="lg">
                    <div class="d-flex flex-column flex-sm-row align-sm-center justify-space-between gap-3">
                        <span>{{ error }}</span>
                        <v-btn size="small" color="error" variant="outlined" rounded="lg" @click="refresh">
                            {{ t('analytics.retry') }}
                        </v-btn>
                    </div>
                </v-alert>
            </v-col>
        </v-row>

        <!-- ── Empty state ────────────────────────────────────────────── -->
        <v-row v-if="!loading && !hasData && !error" class="mb-6">
            <v-col cols="12">
                <v-alert type="info" variant="tonal" border="start" rounded="lg">
                    {{ t('analytics.empty') }}
                </v-alert>
            </v-col>
        </v-row>

        <!-- ── Latest activity ────────────────────────────────────────── -->
        <v-row v-if="!error" class="mb-6" density="comfortable">

            <!-- Latest comments -->
            <v-col cols="12" md="6" class="d-flex">
                <v-card class="analytics-card w-100" elevation="0">
                    <v-card-title class="card-header">
                        <div class="card-header-icon" style="background:#EEEDFE">
                            <v-icon size="16" color="#534AB7">mdi-comment-text-multiple-outline</v-icon>
                        </div>
                        <span class="card-header-title">{{ t('analytics.sections.latestComments') }}</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="pa-0">
                        <v-skeleton-loader
                            v-if="loading"
                            :type="['list-item-two-line', 'list-item-two-line', 'list-item-two-line']"
                            class="px-4 py-2"
                        />
                        <div v-else-if="!hasLatestComments" class="empty-list-msg">
                            {{ t('analytics.emptyComments') }}
                        </div>
                        <v-list v-else lines="two" class="py-1">
                            <v-list-item
                                v-for="comment in latestComments"
                                :key="comment.id"
                                class="comment-item"
                            >
                                <template #prepend>
                                    <div class="comment-avatar">
                                        {{ (comment.routeName || '?').charAt(0).toUpperCase() }}
                                    </div>
                                </template>
                                <v-list-item-title class="item-title">
                                    {{ comment.routeName || t('analytics.labels.unknown') }}
                                </v-list-item-title>
                                <v-list-item-subtitle class="item-sub">
                                    {{ comment.comment }}
                                </v-list-item-subtitle>
                                <template #append>
                                    <div class="d-flex flex-column align-end gap-1">
                                        <div v-if="comment.rating !== null" class="rating-badge">
                                            <v-icon size="12" color="warning">mdi-star</v-icon>
                                            <span>{{ formatRating(comment.rating) }}</span>
                                        </div>
                                        <span class="time-label">{{ formatDate(comment.created) }}</span>
                                    </div>
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Latest routes -->
            <v-col cols="12" md="6" class="d-flex">
                <v-card class="analytics-card w-100" elevation="0">
                    <v-card-title class="card-header">
                        <div class="card-header-icon" style="background:#E1F5EE">
                            <v-icon size="16" color="#0F6E56">mdi-map-marker-path</v-icon>
                        </div>
                        <span class="card-header-title">{{ t('analytics.sections.latestRoutes') }}</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="pa-0">
                        <v-skeleton-loader
                            v-if="loading"
                            :type="['list-item-two-line', 'list-item-two-line', 'list-item-two-line']"
                            class="px-4 py-2"
                        />
                        <div v-else-if="!hasLatestRoutes" class="empty-list-msg">
                            {{ t('analytics.emptyRoutes') }}
                        </div>
                        <v-list v-else lines="two" class="py-1">
                            <v-list-item
                                v-for="route in latestRoutes"
                                :key="route.id"
                                class="comment-item"
                            >
                                <template #prepend>
                                    <div class="route-avatar">
                                        <v-icon size="16" color="#0F6E56">mdi-routes</v-icon>
                                    </div>
                                </template>
                                <v-list-item-title class="item-title">
                                    {{ route.name || t('analytics.labels.unknown') }}
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    <div class="route-chips">
                                        <span v-if="route.difficulty" class="route-chip chip-difficulty">
                                            <v-icon size="10">mdi-tag-outline</v-icon>
                                            {{ route.difficulty }}
                                        </span>
                                        <span v-if="route.location" class="route-chip chip-location">
                                            <v-icon size="10">mdi-map-marker-outline</v-icon>
                                            {{ route.location }}
                                        </span>
                                        <span v-if="route.creators?.length" class="route-chip chip-setter">
                                            <v-icon size="10">mdi-account-hard-hat</v-icon>
                                            {{ formatCreators(route.creators) }}
                                        </span>
                                    </div>
                                </v-list-item-subtitle>
                                <template #append>
                                    <span class="time-label">{{ formatDate(route.screwDate) }}</span>
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
                <v-card class="analytics-card w-100" elevation="0">
                    <v-card-title class="card-header">
                        <div class="card-header-icon" style="background:#E6F1FB">
                            <v-icon size="16" color="#185FA5">mdi-chart-bar</v-icon>
                        </div>
                        <span class="card-header-title">{{ t('analytics.charts.difficultyDistribution') }}</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <v-skeleton-loader v-if="loading" type="image" class="chart-skeleton" />
                        <BaseEchart
                            v-else-if="hasData"
                            :option="difficultyOption"
                            :height="340"
                        />
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="6" class="d-flex">
                <v-card class="analytics-card w-100" elevation="0">
                    <v-card-title class="card-header">
                        <div class="card-header-icon" style="background:#E1F5EE">
                            <v-icon size="16" color="#0F6E56">mdi-chart-timeline-variant</v-icon>
                        </div>
                        <span class="card-header-title">{{ t('analytics.charts.routeTimeline') }}</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <v-skeleton-loader v-if="loading" type="image" class="chart-skeleton" />
                        <BaseEchart
                            v-else-if="hasData"
                            :option="routeTimelineOption"
                            :height="340"
                        />
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- ── Charts row 2: setters + comment timeline ───────────────── -->
        <v-row density="comfortable">
            <v-col cols="12" md="6" class="d-flex">
                <v-card class="analytics-card w-100" elevation="0">
                    <v-card-title class="card-header">
                        <div class="card-header-icon" style="background:#FAEEDA">
                            <v-icon size="16" color="#854F0B">mdi-account-hard-hat</v-icon>
                        </div>
                        <span class="card-header-title">{{ t('analytics.charts.routeSetters') }}</span>
                        <v-spacer />
                        <v-switch
                            v-model="showAllSetters"
                            color="primary"
                            density="compact"
                            hide-details
                            inset
                            :label="t('analytics.actions.showAllSetters')"
                            class="setter-switch"
                        />
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <v-skeleton-loader v-if="loading" type="image" class="chart-skeleton" />
                        <BaseEchart
                            v-else-if="hasData"
                            :option="routeSettersOption"
                            :height="340"
                        />
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="6" class="d-flex">
                <v-card class="analytics-card w-100" elevation="0">
                    <v-card-title class="card-header">
                        <div class="card-header-icon" style="background:#EEEDFE">
                            <v-icon size="16" color="#534AB7">mdi-message-text-clock-outline</v-icon>
                        </div>
                        <span class="card-header-title">{{ t('analytics.charts.commentTimeline') }}</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <v-skeleton-loader v-if="loading" type="image" class="chart-skeleton" />
                        <BaseEchart
                            v-else-if="hasData"
                            :option="commentTimelineOption"
                            :height="340"
                        />
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

    </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useTheme } from 'vuetify'
import BaseEchart from '@/components/analytics/BaseEchart.vue'
import StatsCard from '@/components/analytics/StatsCard.vue'
import { useClimbingAnalytics } from '@/composables/useClimbingAnalytics'

const { t } = useI18n()

useHead(() => ({
    title: t('analytics.meta.title'),
    meta: [{ name: 'description', content: t('analytics.meta.description') }],
}))

definePageMeta({
    authRequired: true,
    middleware: ['auth'],
})

const {
    summary,
    difficultyDistribution,
    routeSetters,
    routeTimeline,
    commentTimeline,
    latestComments,
    latestRoutes,
    hasData,
    loading,
    error,
    refresh,
    load,
} = useClimbingAnalytics()

onMounted(() => load())

const showAllSetters = ref(false)

// ── Summary cards ─────────────────────────────────────────────────────────

const summaryCards = computed(() => [
    {
        key: 'totalRoutes',
        title: t('analytics.cards.totalRoutes'),
        value: summary.value.totalRoutes,
        icon: 'mdi-map-marker-path',
        accentColor: '#1D9E75',
        iconBg: '#E1F5EE',
        iconFg: '#1D9E75',
        delta: summary.value.totalRoutesDelta ?? null,
        sparkline: summary.value.totalRoutesTrend ?? [],
        subtitle: t('analytics.cards.totalRoutesSubtitle'),
        format: (value) => `${value}`,
    },
    {
        key: 'activeRoutes',
        title: t('analytics.cards.activeRoutes'),
        value: summary.value.activeRoutes,
        icon: 'mdi-flag-checkered',
        accentColor: '#378ADD',
        iconBg: '#E6F1FB',
        iconFg: '#378ADD',
        delta: summary.value.activeRoutesDelta ?? null,
        sparkline: summary.value.activeRoutesTrend ?? [],
        subtitle: t('analytics.cards.activeRoutesSubtitle'),
        format: (value) => `${value}`,
    },
    {
        key: 'averageDifficulty',
        title: t('analytics.cards.averageDifficulty'),
        value: summary.value.averageDifficulty,
        icon: 'mdi-summit',
        accentColor: '#EF9F27',
        iconBg: '#FAEEDA',
        iconFg: '#BA7517',
        delta: summary.value.averageDifficultyDelta ?? null,
        sparkline: summary.value.difficultyTrend ?? [],
        subtitle: t('analytics.cards.averageDifficultySubtitle'),
        format: (value) => Number(value).toFixed(2),
    },
    {
        key: 'totalComments',
        title: t('analytics.cards.totalComments'),
        value: summary.value.totalComments,
        icon: 'mdi-comment-text-multiple',
        accentColor: '#7F77DD',
        iconBg: '#EEEDFE',
        iconFg: '#534AB7',
        delta: summary.value.totalCommentsDelta ?? null,
        sparkline: summary.value.commentsTrend ?? [],
        subtitle: t('analytics.cards.totalCommentsSubtitle'),
        format: (value) => `${value}`,
    },
])

// ── List helpers ──────────────────────────────────────────────────────────

const hasLatestComments = computed(() => latestComments.value.length > 0)
const hasLatestRoutes = computed(() => latestRoutes.value.length > 0)

// ── Theme-aware chart colors ──────────────────────────────────────────────
// ECharts cannot read CSS variables, so we resolve them once from the DOM
// and reuse the result across all chart options.

function getCSSColor(variable) {
    if (typeof window === 'undefined') return '#888'
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
}

const chartColors = computed(() => {
    // Depend on theme so charts recompute on theme switch
    const isDark = useTheme().global.current.value.dark

    // Vuetify exposes RGB channels as CSS vars, e.g. --v-theme-on-surface = "0 0 0"
    const onSurface = getCSSColor('--v-theme-on-surface') || (isDark ? '236 236 236' : '18 18 18')
    const surface   = getCSSColor('--v-theme-surface')    || (isDark ? '30 30 30'    : '255 255 255')

    const labelColor    = `rgba(${onSurface}, 0.45)`
    const gridColor     = `rgba(${onSurface}, 0.08)`
    const tooltipBg     = `rgba(${surface}, 0.96)`
    const tooltipText   = `rgba(${onSurface}, 0.9)`
    const tooltipMuted  = `rgba(${onSurface}, 0.45)`
    const tooltipBorder = `rgba(${onSurface}, 0.1)`

    return { labelColor, gridColor, tooltipBg, tooltipText, tooltipMuted, tooltipBorder }
})

// ── Shared chart helpers ──────────────────────────────────────────────────

function buildTooltip(name, value, unit) {
    const { tooltipText, tooltipMuted } = chartColors.value
    return `<span style="font-size:13px;color:${tooltipMuted}">${name}</span><br/>
            <span style="font-weight:600;font-size:15px;color:${tooltipText}">${value}</span>
            <span style="font-size:12px;color:${tooltipMuted};margin-left:4px">${unit}</span>`
}

const tooltipBase = computed(() => {
    const { tooltipBg, tooltipText, tooltipBorder } = chartColors.value
    return {
        trigger: 'axis',
        axisPointer: { type: 'none' },
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: tooltipText },
        extraCssText: 'border-radius:8px;padding:10px 14px;box-shadow:0 4px 16px rgba(0,0,0,0.12)',
    }
})

const gridBase = { left: '0%', right: '1%', bottom: '0%', top: '8%', containLabel: true }

function makeXAxis(labels) {
    const { labelColor } = chartColors.value
    return {
        type: 'category',
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
            color: labelColor,
            fontSize: 11,
            rotate: labels.length > 9 ? 35 : 0,
            margin: 10,
        },
    }
}

const yAxisBase = computed(() => {
    const { labelColor, gridColor } = chartColors.value
    return {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: labelColor, fontSize: 11 },
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
    }
})

function makeBarSeries(name, data, color, emphasisColor) {
    return {
        name,
        type: 'bar',
        barMaxWidth: 32,
        data,
        itemStyle: { color, borderRadius: [4, 4, 0, 0] },
        emphasis: { itemStyle: { color: emphasisColor } },
        animationDelay: (idx) => idx * 40,
    }
}

function aggregateByMonth(source) {
    const map = new Map()
    for (const item of source) {
        const key = extractMonthKey(item.period)
        if (!key) continue
        map.set(key, (map.get(key) ?? 0) + item.count)
    }
    const keys = Array.from(map.keys()).sort()
    return {
        labels: keys.map(formatMonthLabel),
        values: keys.map((k) => map.get(k) ?? 0),
    }
}

// ── Chart: difficulty distribution ────────────────────────────────────────

const difficultyOption = computed(() => ({
    backgroundColor: 'transparent',
    tooltip: {
        ...tooltipBase.value,
        formatter: (params) => buildTooltip(params[0].name, params[0].value, 'routes'),
    },
    grid: gridBase,
    xAxis: makeXAxis(difficultyDistribution.value.map((item) => item.grade)),
    yAxis: yAxisBase.value,
    series: [
        makeBarSeries(
            t('analytics.charts.difficultyDistribution'),
            difficultyDistribution.value.map((item) => item.count),
            '#378ADD',
            '#85B7EB',
        ),
    ],
    animationEasing: 'cubicOut',
}))

// ── Chart: route timeline ─────────────────────────────────────────────────

const routeTimelineOption = computed(() => {
    const { labels, values } = aggregateByMonth(routeTimeline.value)
    return {
        backgroundColor: 'transparent',
        tooltip: {
            ...tooltipBase.value,
            formatter: (params) => buildTooltip(params[0].name, params[0].value, 'routes'),
        },
        grid: gridBase,
        xAxis: makeXAxis(labels),
        yAxis: yAxisBase.value,
        series: [makeBarSeries(t('analytics.charts.routeTimeline'), values, '#1D9E75', '#5DCAA5')],
        animationEasing: 'cubicOut',
    }
})

// ── Chart: comment timeline ───────────────────────────────────────────────

const commentTimelineOption = computed(() => {
    const { labels, values } = aggregateByMonth(commentTimeline.value)

    const maxVal = Math.max(...values, 1)
    const rawStep = maxVal / 4
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)))
    const niceStep =
        [1, 2, 5, 10].map((f) => f * magnitude).find((s) => s >= rawStep) ?? magnitude * 10
    const yMax = Math.ceil(maxVal / niceStep) * niceStep

    return {
        backgroundColor: 'transparent',
        tooltip: {
            ...tooltipBase.value,
            formatter: (params) =>
                buildTooltip(params[0].name, params[0].value, t('analytics.labels.comments')),
        },
        grid: gridBase,
        xAxis: makeXAxis(labels),
        yAxis: { ...yAxisBase.value, max: yMax, interval: niceStep },
        series: [
            makeBarSeries(t('analytics.labels.comments'), values, '#7F77DD', '#AFA9EC'),
        ],
        animationEasing: 'cubicOut',
    }
})

// ── Chart: route setters ──────────────────────────────────────────────────

const routeSettersData = computed(() => {
    const otherLabel = t('analytics.labels.other')
    const unknownLabel = t('analytics.labels.unknown')

    const sorted = routeSetters.value
        .map((item) => ({ name: item.setter?.trim() || unknownLabel, value: item.count }))
        .sort((a, b) => b.value - a.value)

    if (showAllSetters.value) return sorted

    let otherCount = 0
    const aggregated = []
    for (const item of sorted) {
        if (item.value <= 1) otherCount += item.value
        else aggregated.push(item)
    }
    if (otherCount > 0) aggregated.push({ name: otherLabel, value: otherCount })

    return aggregated
})

const SETTER_COLORS = [
    '#5B8DB8', '#4A9E7A', '#B8893A', '#7B72B8',
    '#B86A4A', '#A85A7A', '#3A8A8A', '#6A9AB0',
    '#6A9A5A', '#A89040', '#8A70B0', '#A86060',
]

const routeSettersOption = computed(() => {
    const { tooltipBg, tooltipText, tooltipMuted, tooltipBorder, labelColor } = chartColors.value
    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            formatter: ({ name, value, percent }) =>
                `<span style="font-size:13px;color:${tooltipMuted}">${name}</span><br/>
                 <span style="font-weight:600;font-size:15px;color:${tooltipText}">${value} routes</span>
                 <span style="font-size:12px;color:${tooltipMuted};margin-left:4px">(${percent}%)</span>`,
            backgroundColor: tooltipBg,
            borderColor: tooltipBorder,
            borderWidth: 1,
            textStyle: { color: tooltipText },
            extraCssText: 'border-radius:10px;padding:10px 14px;box-shadow:0 4px 16px rgba(0,0,0,0.12)',
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
            formatter: (name) => {
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


// ── Formatters ────────────────────────────────────────────────────────────

function formatDate(isoString) {
    if (!isoString) return t('analytics.labels.unknown')
    try {
        const date = new Date(isoString)
        const hasTime = typeof isoString === 'string' && isoString.includes('T')
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            ...(hasTime ? { timeStyle: 'short' } : {}),
        }).format(date)
    } catch (e) {
        console.error('Failed to format date', e)
        return isoString
    }
}

function formatRating(value) {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return ''
    return numeric.toFixed(1)
}

function formatCreators(creators) {
    if (!Array.isArray(creators) || creators.length === 0) return t('analytics.labels.unknown')
    return creators.join(', ')
}

function extractMonthKey(isoDate) {
    if (!isoDate) return null
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return null
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
}

function formatMonthLabel(monthKey) {
    try {
        const [year, month] = monthKey.split('-').map(Number)
        if (!year || !month) return monthKey
        return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(
            new Date(year, month - 1, 1),
        )
    } catch (e) {
        console.error('Failed to format month label', e)
        return monthKey
    }
}
</script>

<style scoped>
.analytics-page {
    background: rgb(var(--v-theme-background));
}

/* ── Header ──────────────────────────────────────────────────────────── */
.page-title {
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: rgb(var(--v-theme-on-background));
}

.page-subtitle {
    font-size: 0.85rem;
    color: rgba(var(--v-theme-on-background), 0.5);
}

.generated-at {
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-background), 0.4);
}

/* ── Shared card shell ───────────────────────────────────────────────── */
.analytics-card {
    border-radius: 14px !important;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.07) !important;
    background: rgb(var(--v-theme-surface)) !important;
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
    background: #E1F5EE;
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

.chip-difficulty { background: #E6F1FB; color: #185FA5; }
.chip-location   { background: #E1F5EE; color: #0F6E56; }
.chip-setter     { background: #FAEEDA; color: #854F0B; }

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

.empty-list-msg {
    padding: 24px 16px;
    font-size: 0.85rem;
    color: rgba(var(--v-theme-on-surface), 0.4);
    text-align: center;
}

/* ── Misc ────────────────────────────────────────────────────────────── */
.chart-skeleton { height: 300px; }

.setter-switch { font-size: 12px; flex-shrink: 0; }

@media (max-width: 600px) {
    .analytics-page { padding-inline: 12px; }
    .page-title { font-size: 1.35rem; }
}
</style>