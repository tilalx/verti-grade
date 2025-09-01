import { tr as $vuetify } from 'vuetify/locale'
import messages from './tr.json'

export default defineI18nLocale(async locale => {
  return {
    $vuetify,
    ...messages
  }
})