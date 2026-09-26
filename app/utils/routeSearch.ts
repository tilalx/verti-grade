const SIGNED_GRADE = /^(\d{1,2})([+-])$/
const BARE_GRADE = /^\d{1,2}$/

const quote = (value: string) =>
    `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`

function gradeFilter(level: string, sign?: string) {
    if (sign === '+')
        return `(difficulty = ${level} && (difficulty_sign = true || difficulty_sign = "+"))`
    if (sign === '-')
        return `(difficulty = ${level} && (difficulty_sign = false || difficulty_sign = "-"))`
    return `difficulty = ${level}`
}

export function routeSearchFilter(query: string) {
    const tokens = query.trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 1 && BARE_GRADE.test(tokens[0]!))
        return gradeFilter(tokens[0]!)

    const grades = tokens.flatMap((token) => {
        const match = token.match(SIGNED_GRADE)
        return match ? [gradeFilter(match[1]!, match[2])] : []
    })
    const phrase = tokens.filter((token) => !SIGNED_GRADE.test(token)).join(' ')
    const text = phrase
        ? [`(name ~ ${quote(phrase)} || creator ~ ${quote(phrase)})`]
        : []
    return [...text, ...grades].join(' && ')
}
