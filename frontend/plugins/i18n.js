import messages from "~/locales/messages"
import { useMainStore } from "#imports"

export default defineNuxtPlugin(() => {
  const mainStore = useMainStore()
  const locale = mainStore.getLocale() || 'de'

  return {
    legacy: false,
    locale: locale,
    fallbackLocale: 'en',
    messages: {
      en: messages.en,
      de: messages.de
    }
  }
})
