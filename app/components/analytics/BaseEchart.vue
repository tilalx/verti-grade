<template>
    <client-only>
        <div ref="chartEl" :style="containerStyle" class="base-echart"></div>
    </client-only>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface ChartProps {
    option: Record<string, unknown>
    height?: string | number
    responsive?: boolean
}

const props = withDefaults(defineProps<ChartProps>(), {
    height: '320px',
    responsive: true,
})

const chartEl = ref<HTMLElement | null>(null)
let chartInstance: any = null
let echartsModule: typeof import('echarts') | null = null

const containerStyle = computed(() => ({
    width: '100%',
    height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))

const resizeChart = () => {
    if (chartInstance) {
        chartInstance.resize()
    }
}

const destroyChart = () => {
    if (props.responsive) {
        window.removeEventListener('resize', resizeChart)
    }
    if (chartInstance) {
        chartInstance.dispose()
        chartInstance = null
    }
}

const renderChart = async () => {
    if (!chartEl.value) {
        return
    }

    if (!echartsModule) {
        echartsModule = await import('echarts')
    }

    if (!chartInstance) {
        chartInstance = echartsModule.init(chartEl.value)
        if (props.responsive) {
            window.addEventListener('resize', resizeChart)
        }
    }

    chartInstance.setOption(props.option, true)
}

onMounted(async () => {
    await nextTick()
    await renderChart()
})

onBeforeUnmount(() => {
    destroyChart()
})

watch(
    () => props.option,
    async (next) => {
        if (!next) {
            return
        }
        await nextTick()
        if (!chartInstance) {
            await renderChart()
            return
        }
        chartInstance.setOption(next, true)
    },
    { deep: true },
)

watch(
    () => props.height,
    () => {
        nextTick().then(() => {
            resizeChart()
        })
    },
)
</script>

<style scoped>
.base-echart {
    min-height: 200px;
}
</style>
