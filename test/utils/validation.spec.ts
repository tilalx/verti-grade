import { describe, it, expect } from 'vitest'
import { required, minLength, maxLength, validEmail, passwordsMatch } from '~/utils/validation'

// Simple translation stub: just return the key so assertions are readable.
const t = (key: string) => key

// ---------------------------------------------------------------------------
// required
// ---------------------------------------------------------------------------

describe('required', () => {
    const rule = required(t)

    it('passes for a non-empty string', () => {
        expect(rule('hello')).toBe(true)
    })

    it('passes for the number 0', () => {
        expect(rule(0)).toBe(true)
    })

    it('passes for false', () => {
        expect(rule(false)).toBe(true)
    })

    it('returns an error key for null', () => {
        expect(rule(null)).toBe('validation.required')
    })

    it('returns an error key for undefined', () => {
        expect(rule(undefined)).toBe('validation.required')
    })

    it('returns an error key for an empty string', () => {
        expect(rule('')).toBe('validation.required')
    })

    it('uses the provided translation function', () => {
        const customT = (key: string) => `TRANSLATED:${key}`
        expect(required(customT)('')).toBe('TRANSLATED:validation.required')
    })
})

// ---------------------------------------------------------------------------
// minLength
// ---------------------------------------------------------------------------

describe('minLength', () => {
    const rule = minLength(t, 6)

    it('passes when length equals n', () => {
        expect(rule('abcdef')).toBe(true)
    })

    it('passes when length exceeds n', () => {
        expect(rule('abcdefgh')).toBe(true)
    })

    it('returns an error key when length is less than n', () => {
        expect(rule('abc')).toBe('validation.minLength')
    })

    it('returns an error key for an empty string', () => {
        expect(rule('')).toBe('validation.minLength')
    })

    it('returns an error key for a non-string value', () => {
        expect(rule(12345)).toBe('validation.minLength')
    })

    it('uses the supplied n in the translation call', () => {
        const calls: Array<[string, unknown]> = []
        const capturingT = (key: string, params?: unknown) => {
            calls.push([key, params])
            return key
        }
        minLength(capturingT, 8)('hi')
        expect(calls[0]).toEqual(['validation.minLength', { n: 8 }])
    })
})

// ---------------------------------------------------------------------------
// maxLength
// ---------------------------------------------------------------------------

describe('maxLength', () => {
    const rule = maxLength(t, 10)

    it('passes when length equals n', () => {
        expect(rule('abcdefghij')).toBe(true)
    })

    it('passes when length is less than n', () => {
        expect(rule('hello')).toBe(true)
    })

    it('passes for an empty string', () => {
        expect(rule('')).toBe(true)
    })

    it('returns an error key when length exceeds n', () => {
        expect(rule('abcdefghijk')).toBe('validation.maxLength')
    })

    it('returns an error key for a non-string value', () => {
        expect(rule(12345678901)).toBe('validation.maxLength')
    })

    it('uses the supplied n in the translation call', () => {
        const calls: Array<[string, unknown]> = []
        const capturingT = (key: string, params?: unknown) => {
            calls.push([key, params])
            return key
        }
        maxLength(capturingT, 30)('a'.repeat(50))
        expect(calls[0]).toEqual(['validation.maxLength', { n: 30 }])
    })
})

// ---------------------------------------------------------------------------
// validEmail
// ---------------------------------------------------------------------------

describe('validEmail', () => {
    const rule = validEmail(t)

    it('passes for a simple valid email', () => {
        expect(rule('user@example.com')).toBe(true)
    })

    it('passes for an email with subdomains', () => {
        expect(rule('user@mail.example.co.uk')).toBe(true)
    })

    it('passes for an email with + alias', () => {
        expect(rule('user+tag@example.com')).toBe(true)
    })

    it('returns an error key for missing @', () => {
        expect(rule('userexample.com')).toBe('validation.email')
    })

    it('returns an error key for missing TLD', () => {
        expect(rule('user@example')).toBe('validation.email')
    })

    it('returns an error key for an empty string', () => {
        expect(rule('')).toBe('validation.email')
    })

    it('returns an error key for null', () => {
        expect(rule(null)).toBe('validation.email')
    })

    it('returns an error key for undefined', () => {
        expect(rule(undefined)).toBe('validation.email')
    })
})

// ---------------------------------------------------------------------------
// passwordsMatch
// ---------------------------------------------------------------------------

describe('passwordsMatch', () => {
    it('passes when values are identical', () => {
        const rule = passwordsMatch(t, () => 'secret123')
        expect(rule('secret123')).toBe(true)
    })

    it('returns an error key when values differ', () => {
        const rule = passwordsMatch(t, () => 'secret123')
        expect(rule('wrong')).toBe('validation.passwordMismatch')
    })

    it('returns an error key for an empty confirmation', () => {
        const rule = passwordsMatch(t, () => 'secret123')
        expect(rule('')).toBe('validation.passwordMismatch')
    })

    it('always reads the current password via the getter', () => {
        let password = 'initial'
        const rule = passwordsMatch(t, () => password)

        expect(rule('initial')).toBe(true)

        password = 'changed'
        expect(rule('initial')).toBe('validation.passwordMismatch')
        expect(rule('changed')).toBe(true)
    })
})
