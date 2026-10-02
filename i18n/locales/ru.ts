import messages from './ru.json'

export default defineI18nLocale(async (locale) => {
    return {
        ...messages,
    }
})
