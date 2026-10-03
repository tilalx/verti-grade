import {
    DEFAULT_ATTEMPT_FACTORS,
    DEFAULT_TOP_POOL,
    rankCompetition,
    type ClimbStyle,
    type ScoringFormat,
    type ScoringSettings,
} from './competitionScoring'

export type ResultsVisibility = 'live' | 'frozen' | 'final' | 'hidden'

export interface StandingRow {
    entry: string
    rank: number
    bib: number
    name: string
    points: number
    tops: number
    zones: number
    rankPoints?: number
}

export interface CategoryStanding {
    id: string
    name: string
    rows: StandingRow[]
}

export interface CompetitionResults {
    visibility: ResultsVisibility
    format: ScoringFormat
    updated: string
    categories: CategoryStanding[]
}

export interface ResultsInput {
    competition: {
        scoring_format: ScoringFormat
        scoring?: Omit<ScoringSettings, 'format'> | null
    }
    categories: { id: string; name: string }[]
    entries: {
        id: string
        category: string
        bib: number
        display_name: string
    }[]
    routes: {
        id: string
        points?: number | null
        zone?: boolean
        voided?: boolean
        hold_count?: number | null
    }[]
    scores: {
        entry: string
        comp_route: string
        attempts: number
        zone_attempt?: number | null
        top_attempt?: number | null
        style?: ClimbStyle | '' | null
        height?: number | null
        height_plus?: boolean | null
    }[]
}

export function resultsVisibility(
    competition: {
        status: string
        live_ranking: boolean
        freeze_at?: string | null
    },
    now: Date,
): ResultsVisibility {
    if (competition.status === 'published') return 'final'
    if (competition.status === 'draft' || !competition.live_ranking) {
        return 'hidden'
    }
    const freezeAt = competition.freeze_at
        ? new Date(competition.freeze_at.replace(' ', 'T'))
        : null
    return freezeAt && now >= freezeAt ? 'frozen' : 'live'
}

export function buildStandings({
    competition,
    categories,
    entries,
    routes,
    scores,
}: ResultsInput): CategoryStanding[] {
    const settings: ScoringSettings = {
        topPool: DEFAULT_TOP_POOL,
        attemptFactors: DEFAULT_ATTEMPT_FACTORS,
        ...competition.scoring,
        format: competition.scoring_format,
    }
    const scoringRoutes = routes.map((route) => ({
        id: route.id,
        points: route.points ?? 0,
        zone: !!route.zone,
        voided: !!route.voided,
        holdCount: route.hold_count,
    }))
    const routeScores = scores.map((score) => ({
        entry: score.entry,
        route: score.comp_route,
        attempts: score.attempts,
        zoneAttempt: score.zone_attempt,
        topAttempt: score.top_attempt,
        style: score.style,
        height: score.height,
        heightPlus: score.height_plus,
    }))
    const entriesById = new Map(entries.map((entry) => [entry.id, entry]))

    return categories.map((category) => {
        const categoryEntries = entries
            .filter((entry) => entry.category === category.id)
            .map((entry) => entry.id)
        const ranked = rankCompetition(
            categoryEntries,
            scoringRoutes,
            routeScores,
            settings,
        )
        return {
            id: category.id,
            name: category.name,
            rows: ranked.map((row) => {
                const entry = entriesById.get(row.entry)!
                return {
                    entry: row.entry,
                    rank: row.rank,
                    bib: entry.bib,
                    name: entry.display_name,
                    points: row.points,
                    tops: row.tops,
                    zones: row.zones,
                    ...(row.rankPoints !== undefined
                        ? { rankPoints: row.rankPoints }
                        : {}),
                }
            }),
        }
    })
}
