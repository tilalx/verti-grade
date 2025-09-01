import { en as $vuetify } from 'vuetify/locale'
import messages from './en.json'

export default defineI18nLocale(async locale => {
    return {
        $vuetify,
        ...messages
    }
})