import messages from './en.json'

export default defineI18nLocale(async (locale) => {
    return {
        ...messages,
    }
})
