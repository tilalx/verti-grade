<template>
    <div data-testid="analytics-heatmap">
        <div class="d-flex d-sm-none flex-wrap ga-2 mb-3">
            <v-chip
                v-for="year in availableYears"
                :key="year"
                :color="year === selectedYear ? 'primary' : undefined"
                :variant="year === selectedYear ? 'flat' : 'outlined'"
                size="small"
                @click="selectedYear = year"
                >{{ year }}</v-chip
            >
        </div>

        <div class="heatmap-outer">
            <div class="heatmap-graph">
                <div class="heatmap-day-labels">
                    <span class="heatmap-day-label" />
                    <span class="heatmap-day-label">{{ dayLabels.mon }}</span>
                    <span class="heatmap-day-label" />
                    <span class="heatmap-day-label">{{ dayLabels.wed }}</span>
                    <span class="heatmap-day-label" />
                    <span class="heatmap-day-label">{{ dayLabels.fri }}</span>
                    <span class="heatmap-day-label" />
                    <span class="heatmap-day-label" />
                </div>
                <div class="heatmap-scroll">
                    <div class="heatmap-month-labels">
                        <span
                            v-for="label in monthLabels"
                            :key="label.key"
                            class="heatmap-month-label"
                            :style="{ gridColumnStart: label.startCol }"
                            >{{ label.text }}</span
                        >
                    </div>
                    <div
                        class="heatmap-grid"
                        @mouseover="onCellHover"
                        @mouseleave="tooltipVisible = false"
                    >
                        <div
                            v-for="cell in cells"
                            :key="cell.date"
                            class="heatmap-cell"
                            :class="[
                                `heatmap-level-${cell.level}`,
                                { 'heatmap-cell--outside': !cell.inYear },
                            ]"
                            :data-label="cell.label"
                            :data-count="cell.count"
                        />
                    </div>
                    <teleport to="body">
                        <div
                            v-if="tooltipVisible"
                            class="heatmap-float-tooltip"
                            :style="tooltipStyle"
                        >
                            {{ tooltipText }}
                        </div>
                    </teleport>
                </div>
            </div>

            <div class="heatmap-years d-none d-sm-flex flex-column">
                <button
                    v-for="year in availableYears"
                    :key="year"
                    class="heatmap-year-btn"
                    :class="{
                        'heatmap-year-btn--active': year === selectedYear,
                    }"
                    :data-testid="`analytics-heatmap-year-${year}`"
                    @click="selectedYear = year"
                >
                    {{ year }}
                </button>
            </div>
        </div>

        <div class="heatmap-legend">
            <span class="heatmap-legend-label">{{
                t('analytics.heatmap.less')
            }}</span>
            <div
                v-for="level in 5"
                :key="level"
                class="heatmap-cell"
                :class="`heatmap-level-${level - 1}`"
            />
            <span class="heatmap-legend-label">{{
                t('analytics.heatmap.more')
            }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { TimelineDatum } from '~/composables/useClimbingAnalytics'

interface HeatmapCell {
    date: string
    count: number
    level: number
    inYear: boolean
    label: string
}

const props = defineProps<{ timeline: TimelineDatum[] }>()

const { t, locale } = useI18n()

const selectedYear = ref(new Date().getFullYear())

const tooltipVisible = ref(false)
const tooltipText = ref('')
const tooltipStyle = ref<Record<string, string>>({})

function onCellHover(event: MouseEvent) {
    const target = event.target as HTMLElement | null
    const label = target?.dataset?.label
    if (!target || !label) {
        tooltipVisible.value = false
        return
    }
    const rect = target.getBoundingClientRect()
    tooltipText.value = label
    tooltipStyle.value = {
        left: `${rect.left + rect.width / 2}px`,
        top: `${rect.top - 6}px`,
    }
    tooltipVisible.value = true
}

const dayLabels = computed(() => {
    const format = new Intl.DateTimeFormat(locale.value, { weekday: 'short' })
    return {
        mon: format.format(new Date(2024, 0, 1)),
        wed: format.format(new Date(2024, 0, 3)),
        fri: format.format(new Date(2024, 0, 5)),
    }
})

const availableYears = computed(() => {
    const years = new Set([new Date().getFullYear()])
    for (const item of props.timeline) {
        const year = Number.parseInt(item.period.slice(0, 4), 10)
        if (!Number.isNaN(year)) years.add(year)
    }
    return Array.from(years).sort((a, b) => b - a)
})

function toIsoDay(date: Date) {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}

function levelFor(count: number) {
    return Math.min(count, 4)
}

const cells = computed<HeatmapCell[]>(() => {
    const year = selectedYear.value

    const startDate = new Date(year, 0, 1)
    const jan1Weekday = startDate.getDay()
    startDate.setDate(
        startDate.getDate() - (jan1Weekday === 0 ? 6 : jan1Weekday - 1),
    )

    const endDate = new Date(year, 11, 31)
    const dec31Weekday = endDate.getDay()
    endDate.setDate(
        endDate.getDate() + (dec31Weekday === 0 ? 0 : 7 - dec31Weekday),
    )

    const countByDay = new Map(
        props.timeline.map((item) => [item.period, item.count]),
    )
    const dateFormatter = new Intl.DateTimeFormat(locale.value, {
        dateStyle: 'medium',
    })

    const result: HeatmapCell[] = []
    for (
        const cursor = new Date(startDate);
        cursor <= endDate;
        cursor.setDate(cursor.getDate() + 1)
    ) {
        const iso = toIsoDay(cursor)
        const inYear = cursor.getFullYear() === year
        const count = countByDay.get(iso) ?? 0
        const formatted = dateFormatter.format(cursor)
        result.push({
            date: iso,
            count,
            level: inYear ? levelFor(count) : 0,
            inYear,
            label: count > 0 ? `${formatted}: ${count}` : formatted,
        })
    }
    return result
})

const monthLabels = computed(() => {
    const monthFormatter = new Intl.DateTimeFormat(locale.value, {
        month: 'short',
    })
    const labels: { key: string; text: string; startCol: number }[] = []
    let previousMonth: string | null = null
    cells.value.forEach((cell, index) => {
        if (!cell.inYear) return
        const month = cell.date.slice(0, 7)
        if (month === previousMonth) return
        previousMonth = month
        const weekStartIndex =
            index % 7 === 0 ? index : index + (7 - (index % 7))
        const weekCol = Math.floor(weekStartIndex / 7) + 1
        if (weekCol > 54) return
        labels.push({
            key: month,
            text: monthFormatter.format(new Date(`${cell.date}T00:00:00`)),
            startCol: weekCol,
        })
    })
    return labels
})
</script>

<style scoped>
.heatmap-outer {
    display: flex;
    gap: 12px;
    align-items: flex-start;
}

.heatmap-graph {
    display: flex;
    gap: 4px;
    flex: 1;
    min-width: 0;
}

.heatmap-day-labels {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-top: 18px;
    flex-shrink: 0;
}

.heatmap-day-label {
    height: 13px;
    line-height: 13px;
    font-size: 10px;
    color: rgba(var(--v-theme-on-surface), 0.45);
    text-align: right;
    white-space: nowrap;
    padding-right: 2px;
}

.heatmap-scroll {
    overflow-x: auto;
    flex: 1;
    min-width: 0;
}

.heatmap-month-labels {
    display: grid;
    grid-template-columns: repeat(54, 13px);
    gap: 2px;
    height: 16px;
    margin-bottom: 2px;
}

.heatmap-month-label {
    font-size: 10px;
    color: rgba(var(--v-theme-on-surface), 0.45);
    white-space: nowrap;
    overflow: visible;
}

.heatmap-grid {
    display: grid;
    grid-template-columns: repeat(54, 13px);
    grid-template-rows: repeat(7, 13px);
    grid-auto-flow: column;
    gap: 2px;
    width: fit-content;
}

.heatmap-cell {
    width: 13px;
    height: 13px;
    border-radius: 3px;
    cursor: default;
    flex-shrink: 0;
}

.heatmap-cell--outside {
    opacity: 0;
    pointer-events: none;
}

.heatmap-years {
    flex-shrink: 0;
    padding-top: 18px;
    gap: 2px !important;
}

.heatmap-year-btn {
    display: block;
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 6px;
    border: none;
    background: none;
    color: rgba(var(--v-theme-on-surface), 0.5);
    cursor: pointer;
    text-align: right;
    transition:
        color 0.15s,
        background 0.15s;
    white-space: nowrap;
}

.heatmap-year-btn:hover {
    color: rgb(var(--v-theme-on-surface));
    background: rgba(var(--v-theme-on-surface), 0.06);
}

.heatmap-year-btn--active {
    color: rgb(var(--v-theme-primary));
    font-weight: 600;
}

.heatmap-legend {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 10px;
    justify-content: flex-end;
}

.heatmap-legend-label {
    font-size: 10px;
    color: rgba(var(--v-theme-on-surface), 0.45);
}

.heatmap-level-0 {
    background: rgba(var(--v-theme-on-surface), 0.07);
}
.heatmap-level-1 {
    background: #0f6e56;
}
.heatmap-level-2 {
    background: #1d9e75;
}
.heatmap-level-3 {
    background: #5dcaa5;
}
.heatmap-level-4 {
    background: #7fffdb;
}

.heatmap-float-tooltip {
    position: fixed;
    z-index: 2000;
    transform: translate(-50%, -100%);
    pointer-events: none;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    white-space: nowrap;
    background: rgb(var(--v-theme-surface-variant));
    color: rgb(var(--v-theme-on-surface-variant));
}

@media (min-width: 600px) {
    .heatmap-scroll {
        overflow-x: clip;
    }

    .heatmap-month-labels {
        grid-template-columns: repeat(54, 1fr);
        width: 100%;
    }

    .heatmap-grid {
        grid-template-columns: repeat(54, 1fr);
        grid-template-rows: repeat(7, 1fr);
        width: 100%;
        aspect-ratio: 54 / 7;
    }

    .heatmap-grid .heatmap-cell {
        width: auto;
        height: auto;
    }

    .heatmap-day-labels {
        padding-top: 0;
        align-self: stretch;
    }

    .heatmap-day-labels > span:first-child {
        flex-shrink: 0;
        height: 16px;
    }

    .heatmap-day-labels > span:not(:first-child) {
        flex: 1;
        height: auto;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: flex-end;
    }
}
</style>
