export const SUPPORTED_LOCALES = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ru', name: 'Русский' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'uk', name: 'Українська' },
] as const

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]['code']

export const DEFAULT_LOCALE: LocaleCode = 'en'

export function isLocaleCode(value: unknown): value is LocaleCode {
    return SUPPORTED_LOCALES.some((locale) => locale.code === value)
}
