export const COMPETITION_DISCIPLINES = ['boulder', 'rope'] as const
export type CompetitionDiscipline = (typeof COMPETITION_DISCIPLINES)[number]

export const SCORING_FORMATS = [
    'dynamic',
    'fixed',
    'ifsc',
    'tops',
    'route_points',
    'lead_height',
] as const
export type ScoringFormat = (typeof SCORING_FORMATS)[number]

export const FORMATS_BY_DISCIPLINE: Record<
    CompetitionDiscipline,
    ScoringFormat[]
> = {
    boulder: ['dynamic', 'fixed', 'ifsc', 'tops'],
    rope: ['route_points', 'lead_height', 'dynamic'],
}

export const JUDGE_ONLY_FORMATS: readonly ScoringFormat[] = ['lead_height']

export type ClimbStyle = 'lead' | 'toprope'

export interface ScoringSettings {
    format: ScoringFormat
    topPool?: number
    zonePool?: number
    attemptFactors?: number[]
    bestOf?: number | null
    flashBonus?: number
    topropeFactor?: number
}

export interface CompetitionRoute {
    id: string
    points?: number
    zone?: boolean
    voided?: boolean
    holdCount?: number | null
}

export interface RouteScore {
    entry: string
    route: string
    attempts: number
    zoneAttempt?: number | null
    topAttempt?: number | null
    style?: ClimbStyle | '' | null
    height?: number | null
    heightPlus?: boolean | null
}

export interface RankedEntry {
    entry: string
    rank: number
    points: number
    tops: number
    zones: number
    attemptsToTop: number
    attemptsToZone: number
    rankPoints?: number
}

export const DEFAULT_TOP_POOL = 1000
export const DEFAULT_ATTEMPT_FACTORS = [1, 0.9, 0.8]
export const DEFAULT_TOPROPE_FACTOR = 0.5
export const IFSC_TOP_POINTS = 25
export const IFSC_ZONE_POINTS = 10
export const IFSC_ATTEMPT_PENALTY = 0.1

const roundPoints = (value: number) => Math.round(value * 100) / 100

const hasTop = (score: RouteScore) => (score.topAttempt ?? 0) > 0
const hasZone = (score: RouteScore) =>
    hasTop(score) || (score.zoneAttempt ?? 0) > 0

function countBy(scores: RouteScore[], reached: (s: RouteScore) => boolean) {
    const counts = new Map<string, number>()
    for (const score of scores) {
        if (reached(score)) {
            counts.set(score.route, (counts.get(score.route) ?? 0) + 1)
        }
    }
    return counts
}

function attemptFactor(factors: number[], attempt: number) {
    return factors[Math.min(attempt, factors.length) - 1] ?? 0
}

function styleAndFlash(
    points: number,
    score: RouteScore,
    settings: ScoringSettings,
) {
    const flash =
        score.topAttempt === 1 ? 1 + (settings.flashBonus ?? 0) / 100 : 1
    const style =
        score.style === 'toprope'
            ? (settings.topropeFactor ?? DEFAULT_TOPROPE_FACTOR)
            : 1
    return points * flash * style
}

function ifscPoints(fullPoints: number, attempt: number) {
    const penaltyTenths = Math.round(IFSC_ATTEMPT_PENALTY * 10)
    return Math.max(0, fullPoints * 10 - penaltyTenths * (attempt - 1)) / 10
}

export function routePoints(
    score: RouteScore,
    route: CompetitionRoute,
    settings: ScoringSettings,
    topsPerRoute: Map<string, number>,
    zonesPerRoute: Map<string, number>,
): number {
    const topAttempt = score.topAttempt ?? 0
    const zoneAttempt = score.zoneAttempt ?? 0
    switch (settings.format) {
        case 'dynamic': {
            if (topAttempt > 0) {
                const share =
                    (settings.topPool ?? DEFAULT_TOP_POOL) /
                    (topsPerRoute.get(route.id) ?? 1)
                return styleAndFlash(share, score, settings)
            }
            if (route.zone && zoneAttempt > 0 && settings.zonePool) {
                return settings.zonePool / (zonesPerRoute.get(route.id) ?? 1)
            }
            return 0
        }
        case 'fixed':
        case 'route_points': {
            if (topAttempt === 0) return 0
            const factors = settings.attemptFactors ?? DEFAULT_ATTEMPT_FACTORS
            return styleAndFlash(
                (route.points ?? 0) * attemptFactor(factors, topAttempt),
                score,
                settings,
            )
        }
        case 'ifsc': {
            if (topAttempt > 0) return ifscPoints(IFSC_TOP_POINTS, topAttempt)
            if (route.zone && zoneAttempt > 0) {
                return ifscPoints(IFSC_ZONE_POINTS, zoneAttempt)
            }
            return 0
        }
        case 'tops':
            return topAttempt > 0 ? 1 : 0
        case 'lead_height':
            return heightValue(score)
    }
}

function heightValue(score: RouteScore | undefined) {
    if (!score) return 0
    return (score.height ?? 0) + (score.heightPlus ? 0.5 : 0)
}

function tiedRankPoints(values: Map<string, number>, entries: string[]) {
    const sorted = [...entries].sort(
        (a, b) => (values.get(b) ?? 0) - (values.get(a) ?? 0),
    )
    const rankPoints = new Map<string, number>()
    let start = 0
    while (start < sorted.length) {
        const value = values.get(sorted[start]!) ?? 0
        let end = start
        while (
            end + 1 < sorted.length &&
            (values.get(sorted[end + 1]!) ?? 0) === value
        ) {
            end++
        }
        const averagePosition = (start + 1 + end + 1) / 2
        for (let index = start; index <= end; index++) {
            rankPoints.set(sorted[index]!, averagePosition)
        }
        start = end + 1
    }
    return rankPoints
}

function leadRankPoints(
    entries: string[],
    routes: CompetitionRoute[],
    scores: RouteScore[],
) {
    const product = new Map(entries.map((entry) => [entry, 1]))
    for (const route of routes) {
        const heights = new Map(
            scores
                .filter((score) => score.route === route.id)
                .map((score) => [score.entry, heightValue(score)]),
        )
        const routeRanks = tiedRankPoints(heights, entries)
        for (const entry of entries) {
            product.set(
                entry,
                product.get(entry)! * (routeRanks.get(entry) ?? entries.length),
            )
        }
    }
    const exponent = 1 / Math.max(routes.length, 1)
    return new Map(
        [...product].map(([entry, value]) => [
            entry,
            Math.round(Math.pow(value, exponent) * 1000) / 1000,
        ]),
    )
}

function comparatorFor(format: ScoringFormat) {
    if (format === 'lead_height') {
        return (a: RankedEntry, b: RankedEntry) =>
            (a.rankPoints ?? 0) - (b.rankPoints ?? 0)
    }
    if (format === 'tops') {
        return (a: RankedEntry, b: RankedEntry) =>
            b.tops - a.tops ||
            b.zones - a.zones ||
            a.attemptsToTop - b.attemptsToTop ||
            a.attemptsToZone - b.attemptsToZone
    }
    return (a: RankedEntry, b: RankedEntry) =>
        b.points - a.points ||
        b.tops - a.tops ||
        b.zones - a.zones ||
        a.attemptsToTop - b.attemptsToTop
}

export function rankCompetition(
    entries: string[],
    routes: CompetitionRoute[],
    scores: RouteScore[],
    settings: ScoringSettings,
): RankedEntry[] {
    const activeRoutes = new Map(
        routes.filter((route) => !route.voided).map((r) => [r.id, r]),
    )
    const entryIds = new Set(entries)
    const countedScores = scores.filter(
        (score) => activeRoutes.has(score.route) && entryIds.has(score.entry),
    )
    const topsPerRoute = countBy(countedScores, hasTop)
    const zonesPerRoute = countBy(
        countedScores,
        (score) => !!activeRoutes.get(score.route)?.zone && hasZone(score),
    )
    const rankPoints =
        settings.format === 'lead_height'
            ? leadRankPoints(entries, [...activeRoutes.values()], countedScores)
            : null
    const usesBestOf =
        settings.bestOf &&
        settings.format !== 'tops' &&
        settings.format !== 'lead_height'

    const scoresByEntry = new Map<string, RouteScore[]>()
    for (const score of countedScores) {
        scoresByEntry.set(score.entry, [
            ...(scoresByEntry.get(score.entry) ?? []),
            score,
        ])
    }

    const unranked: RankedEntry[] = entries.map((entry) => {
        const perRoute = (scoresByEntry.get(entry) ?? [])
            .map((score) => ({
                score,
                points: routePoints(
                    score,
                    activeRoutes.get(score.route)!,
                    settings,
                    topsPerRoute,
                    zonesPerRoute,
                ),
            }))
            .sort((a, b) => b.points - a.points)
        const counted = usesBestOf
            ? perRoute.slice(0, settings.bestOf!)
            : perRoute
        const countedTops = counted.filter(({ score }) => hasTop(score))
        const countedZones = counted.filter(
            ({ score }) =>
                activeRoutes.get(score.route)?.zone && hasZone(score),
        )
        return {
            entry,
            rank: 0,
            points: rankPoints
                ? (rankPoints.get(entry) ?? 0)
                : roundPoints(
                      counted.reduce((sum, { points }) => sum + points, 0),
                  ),
            tops: countedTops.length,
            zones: countedZones.length,
            attemptsToTop: countedTops.reduce(
                (sum, { score }) => sum + (score.topAttempt ?? 0),
                0,
            ),
            attemptsToZone: countedZones.reduce(
                (sum, { score }) =>
                    sum + (score.zoneAttempt || score.topAttempt || 0),
                0,
            ),
            ...(rankPoints ? { rankPoints: rankPoints.get(entry) } : {}),
        }
    })

    const compare = comparatorFor(settings.format)
    const ranked = unranked.sort(compare)
    ranked.forEach((entry, index) => {
        const previous = ranked[index - 1]
        entry.rank =
            previous && compare(previous, entry) === 0
                ? previous.rank
                : index + 1
    })
    return ranked
}
