/**
 * Pure formatting utilities shared across pages and components.
 */

/**
 * Converts a date string or null to a `YYYY-MM-DD` string suitable for
 * HTML date inputs.  Returns `''` for invalid or absent values.
 */
export function formatDateToYYYYMMDD(date: string | null | undefined): string {
    if (!date) return ''
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return ''
    const month = String(parsed.getMonth() + 1).padStart(2, '0')
    const day = String(parsed.getDate()).padStart(2, '0')
    return `${parsed.getFullYear()}-${month}-${day}`
}

/**
 * Formats a date string for display in the given locale.  Returns `''` for
 * invalid or absent values.
 */
export function formatDisplayDate(
    date: string | null | undefined,
    locale?: string,
): string {
    if (!date) return ''
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return ''
    return parsed.toLocaleDateString(locale || undefined)
}

/**
 * "12 min ago" for anything recent, an absolute date once that stops being
 * useful. Takes `t`/`locale` as arguments, the same way the validation rule
 * factories do, so it stays a pure function outside a component.
 */
export function timeAgo(
    dateStr: string | null | undefined,
    t: (key: string, named?: Record<string, unknown>) => string,
    locale: string,
): string {
    if (!dateStr) return ''
    const parsed = new Date(String(dateStr).replace(' ', 'T'))
    if (Number.isNaN(parsed.getTime())) return ''
    const diff = Date.now() - parsed.getTime()
    const mins = Math.floor(diff / 60_000)
    const hours = Math.floor(diff / 3_600_000)
    const days = Math.floor(diff / 86_400_000)
    if (mins < 1) return t('time.justNow')
    if (mins < 60) return t('time.minutesAgo', { n: mins })
    if (hours < 24) return t('time.hoursAgo', { n: hours })
    if (days < 30) return t('time.daysAgo', { n: days })
    return parsed.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

export interface DifficultySource {
    difficulty?: number | string | null
    difficulty_sign?: boolean | string | null
}

/**
 * Formats a route's difficulty into a display string like "7+", "5-", or "6".
 */
export function formatDifficulty(
    route: DifficultySource | null | undefined,
): string {
    const base = route?.difficulty ?? ''
    const sign =
        route?.difficulty_sign === true
            ? '+'
            : route?.difficulty_sign === false
              ? '-'
              : typeof route?.difficulty_sign === 'string'
                ? route.difficulty_sign
                : ''
    return `${base}${sign}`.trim()
}

/**
 * Formats an anchor-point value. Returns '—' for nullish/empty, '-' for 0, otherwise the raw value.
 */
export function formatAnchorPoint(value: unknown): unknown {
    if (value === null || value === undefined || value === '') {
        return '—'
    }
    if (Number(value) === 0) {
        return '-'
    }
    return value
}

/**
 * Formats a route's aggregate score as "X.XX/5" or '—' when absent.
 */
export function formatScore(
    route: { score?: unknown } | null | undefined,
): string {
    const score =
        typeof route?.score === 'number' && Number.isFinite(route.score)
            ? route.score
            : null
    return score !== null ? `${score.toFixed(2)}/5` : '—'
}

/**
 * Normalises a raw creator value (either a CSV string or an array) into a trimmed string[].
 */
export function normalizeCreators(raw: unknown): string[] {
    if (Array.isArray(raw)) {
        return raw
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter(Boolean)
    }
    if (typeof raw === 'string') {
        return raw
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
    }
    return []
}
