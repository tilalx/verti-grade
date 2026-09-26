export type ChangeCategory = 'feat' | 'fix' | 'deps' | 'other'

export interface ReleaseChange {
    type: string | null
    scope: string | null
    breaking: boolean
    subject: string
    author: string | null
    pr: string | null
    category: ChangeCategory
}

const CONVENTIONAL = /^(\w+)(?:\(([^)]+)\))?(!)?:\s+(.+)$/
const BARE_PR = /^https:\/\/github\.com\/\S+\/pull\/(\d+)$/
const BULLET = /^\s*[-*]\s+(.+)$/
const TRAILER =
    /^(.*?)(?:\s+by\s+@(\S+))?(?:\s+in\s+(?:https:\/\/github\.com\/\S+\/pull\/(\d+)|#(\d+)))?\s*$/
const SQUASH_PR = /^(.*?)\s*\(#(\d+)\)$/
const COMPARE = /https:\/\/github\.com\/\S+\/compare\/(\S+)/

function categorize(
    type: string | null,
    scope: string | null,
    author: string | null,
): ChangeCategory {
    if (author?.includes('dependabot') || scope?.startsWith('deps'))
        return 'deps'
    if (type === 'feat') return 'feat'
    if (type === 'fix') return 'fix'
    return 'other'
}

const stripMarkdown = (text: string) =>
    text
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/`([^`]+)`/g, '$1')

export function parseChange(line: string): ReleaseChange {
    const barePr = line.trim().match(BARE_PR)
    if (barePr)
        return {
            type: null,
            scope: null,
            breaking: false,
            subject: '',
            author: null,
            pr: barePr[1]!,
            category: 'other',
        }
    const [, trailed = line, author = null, prUrl, prRef] =
        stripMarkdown(line.trim()).match(TRAILER) ?? []
    const squash = trailed.match(SQUASH_PR)
    const text = squash?.[1] ?? trailed
    const conventional = text.match(CONVENTIONAL)
    const type = conventional?.[1]?.toLowerCase() ?? null
    const scope = conventional?.[2] ?? null
    return {
        type,
        scope,
        breaking: !!conventional?.[3],
        subject: conventional?.[4] ?? text,
        author,
        pr: prUrl ?? prRef ?? squash?.[2] ?? null,
        category: categorize(type, scope, author),
    }
}

export function parseReleaseNotes(body: string | null | undefined) {
    const lines = (body ?? '').replace(/\r\n/g, '\n').split('\n')
    const changes = lines.flatMap((line) => {
        const bullet = line.match(BULLET)
        return bullet ? [parseChange(bullet[1]!)] : []
    })
    const compare = (body ?? '').match(COMPARE)?.[1] ?? null
    return { changes, compare }
}
