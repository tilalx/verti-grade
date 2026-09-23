import type { DifficultySignValue } from '~/types/models'

export const ROUTE_TYPES = ['Route', 'Boulder'] as const

export const DIFFICULTY_LEVELS = Array.from({ length: 10 }, (_, i) => i + 1)

export const COMBINED_DIFFICULTIES = DIFFICULTY_LEVELS.flatMap((level) => [
    `${level} -`,
    String(level),
    `${level} +`,
])

export function toCombinedDifficulty(
    difficulty: number | string | null | undefined,
    sign: DifficultySignValue | undefined,
): string | null {
    if (difficulty === null || difficulty === undefined) return null
    if (sign === true || sign === '+') return `${difficulty} +`
    if (sign === false || sign === '-') return `${difficulty} -`
    return String(difficulty)
}

export function parseCombinedDifficulty(combined: string | null | undefined): {
    difficulty: number | null
    difficulty_sign: boolean | null
} {
    if (!combined) return { difficulty: null, difficulty_sign: null }
    const trimmed = combined.trim()
    const level = parseInt(trimmed, 10)
    return {
        difficulty: Number.isNaN(level) ? null : level,
        difficulty_sign: trimmed.endsWith('+')
            ? true
            : trimmed.endsWith('-')
              ? false
              : null,
    }
}
