export const SUPPORTED_LOCALES = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦' },
] as const

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]['code']

export const DEFAULT_LOCALE: LocaleCode = 'en'

export function isLocaleCode(value: unknown): value is LocaleCode {
    return SUPPORTED_LOCALES.some((locale) => locale.code === value)
}
