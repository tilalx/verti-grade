export type TranslateFn = (
    key: string,
    params?: Record<string, unknown>,
    plural?: number,
) => string
export type Rule = (v: unknown) => true | string

export const required =
    (t: TranslateFn): Rule =>
    (v) =>
        (v !== null && v !== undefined && v !== '') || t('validation.required')

export const minLength =
    (t: TranslateFn, n: number): Rule =>
    (v) =>
        (typeof v === 'string' && v.length >= n) ||
        t('validation.minLength', { n }, n)

export const maxLength =
    (t: TranslateFn, n: number): Rule =>
    (v) =>
        (typeof v === 'string' && v.length <= n) ||
        t('validation.maxLength', { n }, n)

export const validEmail =
    (t: TranslateFn): Rule =>
    (v) =>
        /.+@.+\..+/.test(String(v ?? '')) || t('validation.email')

export const passwordsMatch =
    (t: TranslateFn, getPassword: () => string): Rule =>
    (v) =>
        v === getPassword() || t('validation.passwordMismatch')

export const nonBlank =
    (t: TranslateFn): Rule =>
    (v) =>
        (typeof v === 'string' && v.trim() !== '') || t('validation.required')
