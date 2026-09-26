import { THEME_MODE_COOKIE } from '~/utils/clientStorage'

export default defineNuxtPlugin((nuxtApp) => {
    const chosenMode = useCookie(THEME_MODE_COOKIE).value
    const preference = isExplicitThemeMode(chosenMode)
        ? chosenMode
        : useRequestHeaders(['sec-ch-prefers-color-scheme'])[
              'sec-ch-prefers-color-scheme'
          ]?.toLowerCase()
    if (preference !== 'dark' && preference !== 'light') return

    nuxtApp.hook('vuetify:ssr-client-hints', ({ vuetifyOptions }) => {
        vuetifyOptions.theme =
            typeof vuetifyOptions.theme === 'object' ? vuetifyOptions.theme : {}
        vuetifyOptions.theme.defaultTheme = preference
    })
})
