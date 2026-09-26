import { describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import de from '../../i18n/locales/de.json'
import en from '../../i18n/locales/en.json'
import ru from '../../i18n/locales/ru.json'
import tr from '../../i18n/locales/tr.json'
import uk from '../../i18n/locales/uk.json'

type Messages = { [key: string]: string | Messages }

const flatten = (messages: Messages, prefix = ''): Record<string, string> =>
    Object.fromEntries(
        Object.entries(messages).flatMap(([key, value]) =>
            typeof value === 'string'
                ? [[prefix + key, value]]
                : Object.entries(flatten(value, `${prefix}${key}.`)),
        ),
    )

const english = flatten(en)
const translations = { de, ru, tr, uk }

describe('locales', () => {
    it.each(Object.entries(translations))(
        '%s has exactly the english keys',
        (_, messages) => {
            expect(Object.keys(flatten(messages)).sort()).toEqual(
                Object.keys(english).sort(),
            )
        },
    )

    it.each(Object.entries(translations))(
        '%s translates relative times',
        (_, messages) => {
            const translated = flatten(messages)
            for (const key of Object.keys(english).filter((key) =>
                key.startsWith('time.'),
            )) {
                expect(translated[key]).not.toBe(english[key])
            }
        },
    )
})

describe('plural forms', () => {
    const formsPerLocale = { en: 2, de: 2, tr: 2, ru: 3, uk: 3 }

    it.each(Object.entries({ en, ...translations }))(
        '%s uses one form or the full set of plural forms',
        (locale, messages) => {
            const expected =
                formsPerLocale[locale as keyof typeof formsPerLocale]
            for (const [key, value] of Object.entries(flatten(messages))) {
                const forms = value.split(' | ').length
                expect([1, expected], key).toContain(forms)
            }
        },
    )

    it('renders the grammatical form for each count', async () => {
        vi.stubGlobal('defineI18nConfig', (config: unknown) => config)
        const { default: config } = await import('../../i18n/i18n.config')
        const i18n = createI18n({
            ...(config as () => object)(),
            legacy: false,
            locale: 'ru',
            messages: { en, de, ru, tr, uk },
        })
        const t = i18n.global.t
        const bulkDelete = (count: number) =>
            t('comments.bulkDeleteTitle', { n: count }, count)

        expect(bulkDelete(1)).toBe('Удалить 1 отзыв?')
        expect(bulkDelete(3)).toBe('Удалить 3 отзыва?')
        expect(bulkDelete(5)).toBe('Удалить 5 отзывов?')
        expect(bulkDelete(21)).toBe('Удалить 21 отзыв?')

        i18n.global.locale.value = 'en'
        expect(t('analytics.labels.routeCount', { n: 1 }, 1)).toBe('1 route')
        expect(t('analytics.labels.routeCount', { n: 0 }, 0)).toBe('0 routes')

        i18n.global.locale.value = 'de'
        expect(t('time.daysAgo', { n: 1 }, 1)).toBe('vor 1 Tag')
        expect(t('time.daysAgo', { n: 4 }, 4)).toBe('vor 4 Tagen')
    })
})
