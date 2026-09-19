/**
 * vuetify-nuxt-module seeds the color-scheme cookie with defaultTheme on the
 * very first request — the one request that carries no Sec-CH-Prefers-Color-
 * Scheme header — and from then on prefers that cookie, never even reading
 * the header again: a dark-mode browser keeps getting light SSR forever.
 * The header is the live signal, the cookie only a fallback for browsers that
 * never send one. Runs inside the module's own vuetify:before-create handler,
 * so this always lands after the cookie has been applied.
 */
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
