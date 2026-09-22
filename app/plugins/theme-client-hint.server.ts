export default defineNuxtPlugin((nuxtApp) => {
    const preference = useRequestHeaders(['sec-ch-prefers-color-scheme'])[
        'sec-ch-prefers-color-scheme'
    ]?.toLowerCase()
    if (preference !== 'dark' && preference !== 'light') return

    nuxtApp.hook('vuetify:ssr-client-hints', ({ vuetifyOptions }) => {
        vuetifyOptions.theme =
            typeof vuetifyOptions.theme === 'object' ? vuetifyOptions.theme : {}
        vuetifyOptions.theme.defaultTheme = preference
    })
})
