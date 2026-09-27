export function useThemeColorMeta() {
    const theme = useTheme()
    const background = () => String(theme.current.value.colors.background)

    useHead({
        meta: [{ name: 'theme-color', content: background }],
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
