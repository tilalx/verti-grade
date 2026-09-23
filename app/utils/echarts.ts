export interface ChartColors {
    labelColor: string
    gridColor: string
    tooltipBg: string
    tooltipText: string
    tooltipMuted: string
    tooltipBorder: string
}

export const SETTER_COLORS = [
    '#5B8DB8',
    '#4A9E7A',
    '#B8893A',
    '#7B72B8',
    '#B86A4A',
    '#A85A7A',
    '#3A8A8A',
    '#6A9AB0',
    '#6A9A5A',
    '#A89040',
    '#8A70B0',
    '#A86060',
]

export const gridBase = {
    left: '0%',
    right: '1%',
    bottom: '0%',
    top: '8%',
    containLabel: true,
}

function readCssVar(variable: string) {
    if (typeof window === 'undefined') return ''
    return getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim()
}

export function readChartColors(isDark: boolean): ChartColors {
    const onSurface =
        readCssVar('--v-theme-on-surface') ||
        (isDark ? '236 236 236' : '18 18 18')
    const surface =
        readCssVar('--v-theme-surface') || (isDark ? '30 30 30' : '255 255 255')

    return {
        labelColor: `rgba(${onSurface}, 0.45)`,
        gridColor: `rgba(${onSurface}, 0.08)`,
        tooltipBg: `rgba(${surface}, 0.96)`,
        tooltipText: `rgba(${onSurface}, 0.9)`,
        tooltipMuted: `rgba(${onSurface}, 0.45)`,
        tooltipBorder: `rgba(${onSurface}, 0.1)`,
    }
}

export function buildTooltip(
    colors: ChartColors,
    name: string,
    value: string | number,
    unit: string,
) {
    return `<span style="font-size:13px;color:${colors.tooltipMuted}">${name}</span><br/>
            <span style="font-weight:600;font-size:15px;color:${colors.tooltipText}">${value}</span>
            <span style="font-size:12px;color:${colors.tooltipMuted};margin-left:4px">${unit}</span>`
}

export function tooltipBase(colors: ChartColors) {
    return {
        trigger: 'axis',
        axisPointer: { type: 'none' },
        backgroundColor: colors.tooltipBg,
        borderColor: colors.tooltipBorder,
        textStyle: { color: colors.tooltipText },
        extraCssText:
            'border-radius:8px;padding:10px 14px;box-shadow:0 4px 16px rgba(0,0,0,0.12)',
    }
}

export function makeXAxis(colors: ChartColors, labels: string[]) {
    return {
        type: 'category',
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
            color: colors.labelColor,
            fontSize: 11,
            rotate: labels.length > 9 ? 35 : 0,
            margin: 10,
        },
    }
}

export function yAxisBase(colors: ChartColors) {
    return {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: colors.labelColor, fontSize: 11 },
        splitLine: { lineStyle: { color: colors.gridColor, type: 'dashed' } },
    }
}

export function makeBarSeries(
    name: string,
    data: number[],
    color: string,
    emphasisColor: string,
) {
    return {
        name,
        type: 'bar',
        barMaxWidth: 32,
        data,
        itemStyle: { color, borderRadius: [4, 4, 0, 0] },
        emphasis: { itemStyle: { color: emphasisColor } },
        animationDelay: (idx: number) => idx * 40,
    }
}

export function niceAxis(values: number[]) {
    const maxVal = Math.max(...values, 1)
    const rawStep = maxVal / 4
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)))
    const interval =
        [1, 2, 5, 10].map((f) => f * magnitude).find((s) => s >= rawStep) ??
        magnitude * 10
    return { max: Math.ceil(maxVal / interval) * interval, interval }
}

export function formatMonthLabel(monthKey: string, locale?: string) {
    const [year, month] = monthKey.split('-').map(Number)
    if (!year || !month) return monthKey
    return new Intl.DateTimeFormat(locale, {
        month: 'short',
        year: 'numeric',
    }).format(new Date(year, month - 1, 1))
}
