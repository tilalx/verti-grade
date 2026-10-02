import messages from './uk.json'

export default defineI18nLocale(async (locale) => {
    return {
        ...messages,
    }
})
