<template>
    <AnalyticsBaseEchart
        :option="option"
        :height="320"
        testid="analytics-chart-grades"
    />
</template>

<script setup lang="ts">
import type { GradeDatum } from '#shared/utils/analytics'
import { gridBase, makeXAxis, tooltipBase, yAxisBase } from '~/utils/echarts'

const props = defineProps<{ grades: GradeDatum[]; types: string[] }>()

const { t } = useI18n()
const { colors, palette } = useChartTheme()

const option = computed(() => ({
    backgroundColor: 'transparent',
    color: palette.value.categorical,
    tooltip: tooltipBase(colors.value),
    legend: {
        top: 0,
        textStyle: { color: colors.value.labelColor, fontSize: 11 },
    },
    grid: { ...gridBase, top: 36 },
    xAxis: makeXAxis(
        colors.value,
        props.grades.map((row) => row.grade),
    ),
    yAxis: yAxisBase(colors.value),
    series: [
        ...props.types.map((type, index) => ({
            name: type,
            type: 'bar',
            stack: 'grades',
            barMaxWidth: 28,
            itemStyle: {
                borderColor: 'transparent',
                borderWidth: 1,
                borderRadius:
                    index === props.types.length - 1 ? [4, 4, 0, 0] : 0,
            },
            data: props.grades.map((row) => row.byType[type] ?? 0),
        })),
        {
            name: t('analytics.labels.expected'),
            type: 'line',
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: { type: 'dashed', width: 2 },
            itemStyle: { color: colors.value.labelColor },
            data: props.grades.map((row) => row.expected),
        },
    ],
}))
</script>
