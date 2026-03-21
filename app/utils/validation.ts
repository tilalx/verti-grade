/**
 * Reusable Vuetify validation rule factories.
 *
 * Each factory accepts the `t` translation function from `useI18n()` (and
 * any extra parameters) and returns a rule function that Vuetify expects:
 *   `(value) => true | errorString`
 */

export type TranslateFn = (key: string, params?: Record<string, unknown>) => string
export type Rule = (v: unknown) => true | string

/**
 * Value must be non-null, non-undefined, and non-empty-string.
 */
export const required = (t: TranslateFn): Rule =>
    (v) => (v !== null && v !== undefined && v !== '') || t('validation.required')

/**
 * String value must have at least `n` characters.
 */
export const minLength = (t: TranslateFn, n: number): Rule =>
    (v) => (typeof v === 'string' && v.length >= n) || t('validation.minLength', { n })

/**
 * String value must have at most `n` characters.
 */
export const maxLength = (t: TranslateFn, n: number): Rule =>
    (v) => (typeof v === 'string' && v.length <= n) || t('validation.maxLength', { n })

/**
 * Value must match a simple e-mail pattern.
 */
export const validEmail = (t: TranslateFn): Rule =>
    (v) => /.+@.+\..+/.test(String(v ?? '')) || t('validation.email')

/**
 * Value must equal the password returned by `getPassword()`.
 * Pass a getter so the comparison always uses the current field value.
 */
export const passwordsMatch = (t: TranslateFn, getPassword: () => string): Rule =>
    (v) => v === getPassword() || t('validation.passwordMismatch')
