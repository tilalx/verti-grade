/**
 * Client half of the color-scheme fix (see theme-client-hint.server.ts): the
 * module hands Vuetify the cookie value, which is a stale guess until the
 * browser preference has been written to it at least once. With
 * useBrowserThemeOnly the live matchMedia result is the only truth, so use it
 * for the initial theme — and refresh the cookie so the next SSR agrees.
 */
export default defineNuxtPlugin((nuxtApp) => {
    const browserTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'

    nuxtApp.hook('vuetify:before-create', ({ vuetifyOptions }) => {
        vuetifyOptions.theme =
            typeof vuetifyOptions.theme === 'object' ? vuetifyOptions.theme : {}
        vuetifyOptions.theme.defaultTheme = browserTheme
    })

    document.cookie = `color-scheme=${browserTheme}; Path=/; Max-Age=31536000; SameSite=Lax`

    // First visit: SSR had neither cookie nor client hint and painted the
    // other theme. Repaint before hydration — Vue leaves class mismatches
    // alone in production.
    const ssrTheme = browserTheme === 'dark' ? 'light' : 'dark'
    document
        .querySelectorAll(`.v-theme--${ssrTheme}`)
        .forEach((el) =>
            el.classList.replace(
                `v-theme--${ssrTheme}`,
                `v-theme--${browserTheme}`,
            ),
        )
})
