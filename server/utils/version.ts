export interface InstalledVersion {
    raw: string
    base: string | null
    ahead: number
    sha: string | null
}

export type UpdateMode = 'release' | 'commit' | 'none'

const DESCRIBE = /^(\d+\.\d+\.\d+)-(\d+)-g([0-9a-f]{7,40})$/i
const TRIPLE = /^(\d+)\.(\d+)\.(\d+)$/
const SHA = /^[0-9a-f]{7,40}$/i

export function parseAppVersion(raw: unknown): InstalledVersion {
    const value = String(raw ?? '')
        .trim()
        .replace(/^v/, '')

    const describe = value.match(DESCRIBE)
    if (describe)
        return {
            raw: value,
            base: describe[1]!,
            ahead: Number(describe[2]),
            sha: describe[3]!,
        }

    if (TRIPLE.test(value))
        return { raw: value, base: value, ahead: 0, sha: null }

    if (SHA.test(value)) return { raw: value, base: null, ahead: 0, sha: value }

    return { raw: value, base: null, ahead: 0, sha: null }
}

function triple(version: unknown): [number, number, number] | null {
    const match = String(version ?? '')
        .trim()
        .replace(/^v/, '')
        .match(TRIPLE)
    return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null
}

export function compareSemver(a: unknown, b: unknown): number | null {
    const left = triple(a)
    const right = triple(b)
    if (!left || !right) return null

    for (let i = 0; i < 3; i++) {
        if (left[i]! !== right[i]!) return left[i]! > right[i]! ? 1 : -1
    }
    return 0
}

export function decideUpdate(
    installed: InstalledVersion,
    latestTag: string | null,
    aheadBy: number,
): { mode: UpdateMode; updateAvailable: boolean } {
    if (installed.base && latestTag) {
        const comparison = compareSemver(latestTag, installed.base)
        if (comparison !== null && comparison > 0)
            return { mode: 'release', updateAvailable: true }
    }

    if (installed.sha && aheadBy > 0)
        return { mode: 'commit', updateAvailable: true }

    return { mode: 'none', updateAvailable: false }
}
