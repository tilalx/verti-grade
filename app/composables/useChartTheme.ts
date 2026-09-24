import { chartPalette, readChartColors } from '~/utils/echarts'

export function useChartTheme() {
    const theme = useTheme()
    const isDark = computed(() => theme.global.current.value.dark)
    return {
        colors: computed(() => readChartColors(isDark.value)),
        palette: computed(() => chartPalette(isDark.value)),
    }
}
