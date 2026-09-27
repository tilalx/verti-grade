export function useThemeColorMeta() {
    const theme = useTheme()
    const background = () => String(theme.current.value.colors.background)
    const colorScheme = () => (theme.current.value.dark ? 'dark' : 'light')

    useHead({
        meta: [
            { name: 'theme-color', content: background },
            { name: 'color-scheme', content: colorScheme },
        ],
        htmlAttrs: {
            style: () =>
                `color-scheme: ${colorScheme()}; background-color: ${background()}`,
        },
        bodyAttrs: { style: () => `background-color: ${background()}` },
    })

    if (import.meta.server) return

    watch(
        background,
        async () => {
            await nextTick()
            const meta = document.querySelector('meta[name="theme-color"]')
            if (!meta) return
            meta.setAttribute('content', `${background()}fe`)
            requestAnimationFrame(() =>
                meta.setAttribute('content', background()),
            )
        },
        { flush: 'post' },
    )
}
