// i18n.config.ts
import { en as $vuetifyen } from 'vuetify/locale'
import { de as $vuetifyde } from 'vuetify/locale'
import { ru as $vuetifyru } from 'vuetify/locale'
import { tr as $vuetifytr } from 'vuetify/locale'
import { uk as $vuetifyuk } from 'vuetify/locale'
import en from '../locales/en.json'
import de from '../locales/de.json'
import ru from '../locales/ru.json'
import tr from '../locales/tr.json'
import uk from '../locales/uk.json'

export default defineI18nConfig(() => {
  return {
    legacy: false,
    messages: {
      de: {
        '$vuetify': $vuetifyde,
        ...de,
      },
      en: {
        '$vuetify': $vuetifyen,
        ...en,
      },
      ru: {
        '$vuetify': $vuetifyru,
        ...ru,
      },
      tr: {
        '$vuetify': $vuetifytr,
        ...tr,
      },
      uk: {
        '$vuetify': $vuetifyuk,
        ...uk,
      },
    },
  }
})