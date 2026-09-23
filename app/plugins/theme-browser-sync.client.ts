import { COLOR_SCHEME_COOKIE } from '~/utils/clientStorage'

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

    document.cookie = `${COLOR_SCHEME_COOKIE}=${browserTheme}; Path=/; Max-Age=31536000; SameSite=Lax`

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
