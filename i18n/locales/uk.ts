import { uk as $vuetify } from 'vuetify/locale'
import messages from './uk.json'

export default defineI18nLocale(async locale => {
  return {
    $vuetify,
    ...messages
  }
})