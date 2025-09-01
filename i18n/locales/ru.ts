import { ru as $vuetify } from 'vuetify/locale'
import messages from './ru.json'

export default defineI18nLocale(async locale => {
  return {
    $vuetify,
    ...messages
  }
})