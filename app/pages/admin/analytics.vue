<template>
    <v-container fluid class="analytics-page py-6">
        <v-row class="mb-4">
            <v-col cols="12" class="d-flex flex-column flex-sm-row align-sm-center justify-space-between gap-4">
                <div>
                    <h1 class="text-h4 font-weight-bold mb-1">
                        {{ t('analytics.title') }}
                    </h1>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                        {{ t('analytics.subtitle') }}
                    </p>
                </div>
                <div class="d-flex align-center gap-3">
                    <div v-if="summary.generatedAt" class="text-caption text-medium-emphasis me-4">
                        {{ t('analytics.generatedAt', { value: formatDate(summary.generatedAt) }) }}
                    </div>
                    <v-btn
                        color="primary"
                        variant="flat"
                        :loading="loading"
                        @click="refresh"
                    >
                        <v-icon start>mdi-refresh</v-icon>
                        {{ t('analytics.refresh') }}
                    </v-btn>
                </div>
            </v-col>
        </v-row>

        <v-row class="mb-4" dense>
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
                    :subtitle="card.subtitle"
                    :loading="loading"
                    :format="card.format"
                />
            </v-col>
        </v-row>

        <v-row v-if="!error" class="mb-4" dense>
            <v-col cols="12" md="6" class="d-flex">
                <v-card class="w-100" elevation="2">
                    <v-card-title class="justify-space-between align-center">
                        <span class="text-subtitle-1 font-weight-bold">
                            {{ t('analytics.sections.latestComments') }}
                        </span>
                    </v-card-title>
                    <v-card-text>
                        <v-skeleton-loader
                            v-if="loading"
                            class="mb-2"
                            :type="['list-item-two-line', 'list-item-two-line', 'list-item-two-line']"
                        ></v-skeleton-loader>
                        <div v-else-if="!hasLatestComments" class="text-body-2 text-medium-emphasis">
                            {{ t('analytics.emptyComments') }}
                        </div>
                        <v-list v-else lines="two" class="py-0">
                            <v-list-item
                                v-for="comment in latestComments"
                                :key="comment.id"
                                class="px-0"
                            >
                                <v-list-item-title class="font-weight-medium">
                                    {{ comment.routeName || t('analytics.labels.unknown') }}
                                </v-list-item-title>
                                <v-list-item-subtitle class="text-body-2">
                                    {{ comment.comment }}
                                </v-list-item-subtitle>
                                <template #append>
                                    <div class="d-flex flex-column align-end text-caption text-medium-emphasis">
                                        <div v-if="comment.rating !== null" class="d-flex align-center">
                                            <v-icon size="16" class="me-1" color="warning">
                                                mdi-star
                                            </v-icon>
                                            <span>{{ formatRating(comment.rating) }}</span>
                                        </div>
                                        <div class="d-flex align-center mt-1">
                                            <v-icon size="16" class="me-1" color="primary">
                                                mdi-clock-outline
                                            </v-icon>
                                            <span>{{ formatDate(comment.created) }}</span>
                                        </div>
                                    </div>
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col cols="12" md="6" class="d-flex">
                <v-card class="w-100" elevation="2">
                    <v-card-title class="justify-space-between align-center">
                        <span class="text-subtitle-1 font-weight-bold">
                            {{ t('analytics.sections.latestRoutes') }}
                        </span>
                    </v-card-title>
                    <v-card-text>
                        <v-skeleton-loader
                            v-if="loading"
                            class="mb-2"
                            :type="['list-item-two-line', 'list-item-two-line', 'list-item-two-line']"
                        ></v-skeleton-loader>
                        <div v-else-if="!hasLatestRoutes" class="text-body-2 text-medium-emphasis">
                            {{ t('analytics.emptyRoutes') }}
                        </div>
                        <v-list v-else lines="two" class="py-0">
                            <v-list-item
                                v-for="route in latestRoutes"
                                :key="route.id"
                                class="px-0"
                            >
                                <v-list-item-title class="font-weight-medium">
                                    {{ route.name || t('analytics.labels.unknown') }}
                                </v-list-item-title>
                                <v-list-item-subtitle class="text-body-2">
                                    <div class="d-flex flex-wrap gap-3 align-center">
                                        <span class="d-flex align-center gap-1">
                                            <v-icon size="16" color="primary">mdi-tag-outline</v-icon>
                                            {{ route.difficulty || t('analytics.labels.unknown') }}
                                        </span>
                                        <span class="d-flex align-center gap-1" v-if="route.location">
                                            <v-icon size="16" color="secondary">mdi-map-marker-outline</v-icon>
                                            {{ route.location }}
                                        </span>
                                        <span class="d-flex align-center gap-1" v-if="route.creators?.length">
                                            <v-icon size="16" color="warning">mdi-account-hard-hat</v-icon>
                                            {{ formatCreators(route.creators) }}
                                        </span>
                                    </div>
                                </v-list-item-subtitle>
                                <template #append>
                                    <div class="d-flex flex-column align-end text-caption text-medium-emphasis">
                                        <div class="d-flex align-center">
                                            <v-icon size="16" class="me-1" color="primary">
                                                mdi-calendar-clock
                                            </v-icon>
                                            <span>{{ formatDate(route.screwDate) }}</span>
                                        </div>
                                    </div>
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-row v-if="error">
            <v-col cols="12">
                <v-alert type="error" variant="tonal" border="start" color="error">
                    <div class="d-flex flex-column flex-sm-row align-sm-center justify-space-between gap-3">
                        <span>{{ error }}</span>
                        <v-btn size="small" color="error" variant="outlined" @click="refresh">
                            {{ t('analytics.retry') }}
                        </v-btn>
                    </div>
                </v-alert>
            </v-col>
        </v-row>

        <v-row v-if="!loading && !hasData" class="mb-6">
            <v-col cols="12">
                <v-alert type="info" variant="tonal" border="start" color="primary">
                    {{ t('analytics.empty') }}
                </v-alert>
            </v-col>
        </v-row>

        <v-row>
            <v-col cols="12" md="6" class="d-flex">
                <v-card class="w-100" elevation="2">
                    <v-card-title class="justify-space-between align-center">
                        <span class="text-subtitle-1 font-weight-bold">
                            {{ t('analytics.charts.difficultyDistribution') }}
                        </span>
                    </v-card-title>
                    <v-card-text>
                        <v-skeleton-loader v-if="loading" type="image" class="chart-skeleton"></v-skeleton-loader>
                        <BaseEchart
                            v-else-if="hasData"
                            :option="difficultyOption"
                            :height="360"
                        />
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col cols="12" md="6" class="d-flex">
                <v-card class="w-100" elevation="2">
                    <v-card-title class="text-subtitle-1 font-weight-bold">
                        {{ t('analytics.charts.routeTimeline') }}
                    </v-card-title>
                    <v-card-text>
                        <v-skeleton-loader v-if="loading" type="image" class="chart-skeleton"></v-skeleton-loader>
                        <BaseEchart
                            v-else-if="hasData"
                            :option="routeTimelineOption"
                            :height="360"
                        />
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-row>
            <v-col cols="12" md="6" class="d-flex">
                <v-card class="w-100" elevation="2">
                    <v-card-title class="d-flex justify-space-between align-center gap-4">
                        <span class="text-subtitle-1 font-weight-bold">
                            {{ t('analytics.charts.routeSetters') }}
                        </span>
                        <v-switch
                            v-model="showAllSetters"
                            color="primary"
                            density="compact"
                            hide-details
                            inset
                            :label="t('analytics.actions.showAllSetters')"
                        />
                    </v-card-title>
                    <v-card-text>
                        <v-skeleton-loader v-if="loading" type="image" class="chart-skeleton"></v-skeleton-loader>
                        <BaseEchart
                            v-else-if="hasData"
                            :option="routeSettersOption"
                            :height="360"
                        />
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col cols="12" md="6" class="d-flex">
                <v-card class="w-100" elevation="2">
                    <v-card-title class="text-subtitle-1 font-weight-bold">
                        {{ t('analytics.charts.commentTimeline') }}
                    </v-card-title>
                    <v-card-text>
                        <v-skeleton-loader v-if="loading" type="image" class="chart-skeleton"></v-skeleton-loader>
                        <BaseEchart
                            v-else-if="hasData"
                            :option="commentHeatmapOption"
                            :height="360"
                        />
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseEchart from '@/components/analytics/BaseEchart.vue'
import StatsCard from '@/components/analytics/StatsCard.vue'
import { useClimbingAnalytics } from '@/composables/useClimbingAnalytics'

const { t } = useI18n()

useHead(() => ({
    title: t('analytics.meta.title'),
    meta: [
        {
            name: 'description',
            content: t('analytics.meta.description'),
        },
    ],
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

onMounted(() => {
    load()
})

const showAllSetters = ref(false)

const summaryCards = computed(() => [
    {
        key: 'totalRoutes',
        title: t('analytics.cards.totalRoutes'),
        value: summary.value.totalRoutes,
        icon: 'mdi-map-marker-path',
        subtitle: t('analytics.cards.totalRoutesSubtitle'),
        format: (value) => `${value}`,
    },
    {
        key: 'activeRoutes',
        title: t('analytics.cards.activeRoutes'),
        value: summary.value.activeRoutes,
        icon: 'mdi-flag-checkered',
        subtitle: t('analytics.cards.activeRoutesSubtitle'),
        format: (value) => `${value}`,
    },
    {
        key: 'averageDifficulty',
        title: t('analytics.cards.averageDifficulty'),
        value: summary.value.averageDifficulty,
        icon: 'mdi-summit',
        subtitle: t('analytics.cards.averageDifficultySubtitle'),
        format: (value) => Number(value).toFixed(2),
    },
    {
        key: 'totalComments',
        title: t('analytics.cards.totalComments'),
        value: summary.value.totalComments,
        icon: 'mdi-comment-text-multiple',
        subtitle: t('analytics.cards.totalCommentsSubtitle'),
        format: (value) => `${value}`,
    },
])

const hasLatestComments = computed(() => latestComments.value.length > 0)
const hasLatestRoutes = computed(() => latestRoutes.value.length > 0)

const difficultyOption = computed(() => ({
    backgroundColor: 'transparent',
    tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
    },
    grid: { left: '3%', right: '4%', bottom: '6%', containLabel: true },
    xAxis: [
        {
            type: 'category',
            data: difficultyDistribution.value.map((item) => item.grade),
            axisTick: { alignWithLabel: true },
        },
    ],
    yAxis: [
        {
            type: 'value',
        },
    ],
    series: [
        {
            name: t('analytics.charts.difficultyDistribution'),
            type: 'bar',
            barWidth: '60%',
            data: difficultyDistribution.value.map((item) => item.count),
            itemStyle: { color: '#1976D2' },
        },
    ],
}))

const routeSettersData = computed(() => {
    const otherLabel = t('analytics.labels.other')
    const unknownLabel = t('analytics.labels.unknown')

    const baseData = routeSetters.value.map((item) => ({
        name: item.setter?.trim() || unknownLabel,
        value: item.count,
    }))

    const sorted = [...baseData].sort((a, b) => b.value - a.value)

    if (showAllSetters.value) {
        return sorted
    }

    let otherCount = 0
    const aggregated = []

    for (const item of sorted) {
        if (item.value <= 1) {
            otherCount += item.value
        } else {
            aggregated.push(item)
        }
    }

    if (otherCount > 0) {
        aggregated.push({
            name: otherLabel,
            value: otherCount,
        })
    }

    return aggregated
})

const routeTimelineOption = computed(() => {
    const monthMap = new Map()

    for (const item of routeTimeline.value) {
        const key = extractMonthKey(item.period)
        if (!key) {
            continue
        }
        monthMap.set(key, (monthMap.get(key) ?? 0) + item.count)
    }

    const sortedKeys = Array.from(monthMap.keys()).sort()
    const labels = sortedKeys.map((key) => formatMonthLabel(key))
    const values = sortedKeys.map((key) => monthMap.get(key) ?? 0)

    return {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '6%', containLabel: true },
        xAxis: {
            type: 'category',
            data: labels,
            axisTick: { alignWithLabel: true },
            axisLabel: {
                rotate: labels.length > 6 ? 30 : 0,
            },
        },
        yAxis: { type: 'value' },
        series: [
            {
                name: t('analytics.charts.routeTimeline'),
                type: 'bar',
                data: values,
                itemStyle: { color: '#4DB6AC' },
                animationDelay: (idx) => idx * 60,
            },
        ],
        animationEasing: 'elasticOut',
        animationDelayUpdate: (idx) => idx * 20,
    }
})

const commentHeatmapOption = computed(() =>
    buildCalendarHeatmapOption(
        commentTimeline.value,
        '#B39DDB',
        t('analytics.labels.comments'),
    ),
)

const routeSettersOption = computed(() => ({
    backgroundColor: 'transparent',
    tooltip: {
        trigger: 'item',
        formatter: ({ name, value }) => `${name}: ${value}`,
    },
    series: [
        {
            name: t('analytics.charts.routeSetters'),
            type: 'pie',
            radius: ['20%', '70%'],
            roseType: 'radius',
            itemStyle: {
                borderColor: '#263238',
                borderWidth: 1,
            },
            label: {
                color: '#ECEFF1',
                formatter: '{b}: {c}',
            },
            labelLine: {
                smooth: true,
                lineStyle: { color: '#90A4AE' },
            },
            data: routeSettersData.value,
        },
    ],
    color: ['#8D6E63', '#FFB74D', '#4DD0E1', '#81C784', '#BA68C8', '#F06292', '#7986CB', '#AED581'],
}))

const formatDate = (isoString) => {
    if (!isoString) {
        return t('analytics.labels.unknown')
    }
    try {
        const date = new Date(isoString)
        const hasTime = typeof isoString === 'string' && isoString.includes('T')
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            ...(hasTime ? { timeStyle: 'short' } : {}),
        }).format(date)
    } catch (error) {
        console.error('Failed to format date', error)
        return isoString
    }
}

const formatRating = (value) => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) {
        return ''
    }
    return numeric.toFixed(1)
}

const formatCreators = (creators) => {
    if (!Array.isArray(creators) || creators.length === 0) {
        return t('analytics.labels.unknown')
    }
    return creators.join(', ')
}

function extractMonthKey(isoDate) {
    if (!isoDate) {
        return null
    }
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) {
        return null
    }
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
}

function formatMonthLabel(monthKey) {
    try {
        const [year, month] = monthKey.split('-').map((value) => Number(value))
        if (!year || !month) {
            return monthKey
        }
        const date = new Date(year, month - 1, 1)
        return new Intl.DateTimeFormat(undefined, {
            month: 'short',
            year: 'numeric',
        }).format(date)
    } catch (error) {
        console.error('Failed to format month label', error)
        return monthKey
    }
}

function buildCalendarHeatmapOption(data, accentColor, label) {
    const entries = (data ?? [])
        .map((item) => [item.period, item.count])
        .filter(([date]) => Boolean(date))
        .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    const counts = entries.map(([, value]) => value)
    const maxCount = counts.length > 0 ? Math.max(...counts) : 0
    const safeMax = maxCount > 0 ? maxCount : 1

    const dates = entries.map(([date]) => date)
    const range = getCalendarRange(dates)

    return {
        backgroundColor: 'transparent',
        tooltip: {
            position: 'top',
            formatter: ({ value }) => {
                const [date, count] = value
                return `${formatDate(date)}: ${count} ${label}`
            },
        },
        visualMap: {
            show: true,
            min: 0,
            max: safeMax,
            calculable: false,
            orient: 'horizontal',
            left: 'center',
            top: 10,
            inRange: {
                color: ['#263238', accentColor],
            },
            textStyle: { color: '#ECEFF1' },
        },
        calendar: {
            top: 80,
            left: 'center',
            cellSize: ['auto', 18],
            range,
            itemStyle: {
                color: '#37474F',
                borderColor: '#455A64',
                borderWidth: 1,
            },
            dayLabel: {
                color: '#CFD8DC',
            },
            monthLabel: {
                color: '#ECEFF1',
            },
            yearLabel: {
                color: '#ECEFF1',
            },
        },
        series: [
            {
                name: label,
                type: 'heatmap',
                coordinateSystem: 'calendar',
                data: entries,
            },
        ],
    }
}

function getCalendarRange(dates) {
    const sorted = dates.filter(Boolean).sort()
    if (sorted.length === 0) {
        return new Date().getFullYear().toString()
    }

    const startYear = sorted[0].slice(0, 4)
    const endYear = sorted[sorted.length - 1].slice(0, 4)

    if (startYear === endYear) {
        return startYear
    }

    return [`${startYear}-01-01`, `${endYear}-12-31`]
}
</script>

<style scoped>
.analytics-page {
    background: var(--v-theme-background);
}

.chart-skeleton {
    height: 320px;
}

@media (max-width: 600px) {
    .analytics-page {
        padding-inline: 16px;
    }
}
</style>
