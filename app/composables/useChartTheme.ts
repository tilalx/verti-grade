import { chartPalette, readChartColors } from '~/utils/echarts'

export function useChartTheme() {
    const colorMode = useColorMode()
    const hydrated = useHydrated()
    const isDark = computed(() => hydrated.value && colorMode.value === 'dark')
    return {
        colors: computed(() => readChartColors(isDark.value)),
        palette: computed(() => chartPalette(isDark.value)),
    }
}
