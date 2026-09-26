import { GRADE_SYSTEMS, gradeLabels } from '#shared/utils/grades'

const BARE_NUMBER = /^\d{1,2}$/

const quote = (value: string) =>
    `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`

const ALL_GRADES = [...new Set(GRADE_SYSTEMS.flatMap(gradeLabels))]

function matchingGrades(tokens: string[]) {
    const wanted = tokens.map((token) => token.toLowerCase())
    return ALL_GRADES.filter((grade) => wanted.includes(grade.toLowerCase()))
}

function gradeFilter(grades: string[]) {
    const parts = grades.map((grade) => `grade = ${quote(grade)}`)
    return parts.length === 1 ? parts[0]! : `(${parts.join(' || ')})`
}

const isGradeToken = (token: string) =>
    !BARE_NUMBER.test(token) && matchingGrades([token]).length > 0

export function routeSearchFilter(query: string) {
    const tokens = query.trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 1 && BARE_NUMBER.test(tokens[0]!)) {
        const level = tokens[0]!
        return gradeFilter(matchingGrades([`${level}-`, level, `${level}+`]))
    }

    const grades = tokens
        .filter(isGradeToken)
        .map((token) => gradeFilter(matchingGrades([token])))
    const phrase = tokens.filter((token) => !isGradeToken(token)).join(' ')
    const text = phrase
        ? [`(name ~ ${quote(phrase)} || creator ~ ${quote(phrase)})`]
        : []
    return [...text, ...grades].join(' && ')
}
