import { THEME_COLORS } from '~/utils/themeColors'

export function useThemeColors() {
    const colorMode = useColorMode()
    return computed(
        () => THEME_COLORS[colorMode.value === 'dark' ? 'dark' : 'light'],
    )
}
