import { de as $vuetify } from 'vuetify/locale'
import messages from './de.json'

export default defineI18nLocale(async locale => {
    return {
        $vuetify,
        ...messages
    }
})