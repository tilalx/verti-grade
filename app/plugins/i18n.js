import en from '~/locales/en.json'
import de from '~/locales/de.json'

export default defineNuxtPlugin(() => {
    const locale = navigator.language || 'en'

    return {
        legacy: false,
        locale: locale,
        fallbackLocale: 'en',
        messages: {
            en: en,
            de: de,
        },
    }
})