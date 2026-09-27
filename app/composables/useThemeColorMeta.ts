export function useThemeColorMeta() {
    const theme = useTheme()
    useHead({
        meta: [
            {
                name: 'theme-color',
                content: () => String(theme.current.value.colors.background),
            },
        ],
    })
}
