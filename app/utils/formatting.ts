export function formatDateToYYYYMMDD(date: string | null | undefined): string {
    if (!date) return ''
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return ''
    const month = String(parsed.getMonth() + 1).padStart(2, '0')
    const day = String(parsed.getDate()).padStart(2, '0')
    return `${parsed.getFullYear()}-${month}-${day}`
}

export function formatDisplayDate(
    date: string | null | undefined,
    locale?: string,
): string {
    if (!date) return ''
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return ''
    return parsed.toLocaleDateString(locale || undefined)
}

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

export function locationName(
    record:
        | {
              expand?: Record<string, unknown>
          }
        | null
        | undefined,
): string {
    const location = record?.expand?.location as { name?: string } | undefined
    return location?.name ?? ''
}

export function formatAnchorPoint(value: unknown): unknown {
    if (value === null || value === undefined || value === '') {
        return '—'
    }
    if (Number(value) === 0) {
        return '-'
    }
    return value
}

export function formatScore(
    route: { score?: unknown } | null | undefined,
): string {
    const score =
        typeof route?.score === 'number' && Number.isFinite(route.score)
            ? route.score
            : null
    return score !== null ? `${score.toFixed(2)}/5` : '—'
}

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
