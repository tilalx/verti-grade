// i18n.config.ts
import { en as $vuetifyen } from 'vuetify/locale'
import { de as $vuetifyde } from 'vuetify/locale'
import en from '../locales/en.json'
import de from '../locales/de.json'

export default defineI18nConfig(() => {
  return {
    legacy: false,
    locale: 'en',
    messages: {
      en: {
        '$vuetify': $vuetifyen,
        ...en,
      },
      de: {
        '$vuetify': $vuetifyde,
        ...de,
      }
    },
  }
})