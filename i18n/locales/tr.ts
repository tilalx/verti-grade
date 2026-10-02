import messages from './tr.json'

export default defineI18nLocale(async (locale) => {
    return {
        ...messages,
    }
})
