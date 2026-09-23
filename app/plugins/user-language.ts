import { isLocaleCode } from '~/utils/locales'

export default defineNuxtPlugin(async (nuxtApp) => {
    const pb = usePocketbase()
    const i18n = nuxtApp.$i18n

    const applyUserLanguage = async (language?: string | null) => {
        if (
            isLocaleCode(language) &&
            language !== i18n.locale.value &&
            i18n.availableLocales.includes(language)
        ) {
            await i18n.setLocale(language)
        }
    }

    await applyUserLanguage(pb.authStore.record?.language)

    if (import.meta.client) {
        pb.authStore.onChange((_, record) =>
            applyUserLanguage(record?.language),
        )
    }
})
