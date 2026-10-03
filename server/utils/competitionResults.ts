import type PocketBase from 'pocketbase'
import {
    buildStandings,
    resultsVisibility,
    type CompetitionResults,
    type ResultsInput,
} from '#shared/utils/competitionResults'
import type { CompetitionRecord } from '../../types/models'

export async function loadResults(
    pb: PocketBase,
    competition: CompetitionRecord,
    staff: boolean,
): Promise<CompetitionResults> {
    const visibility = staff
        ? competition.status === 'published'
            ? 'final'
            : 'live'
        : resultsVisibility(competition, new Date())
    const base = {
        visibility,
        format: competition.scoring_format,
        updated: new Date().toISOString(),
    }
    if (visibility === 'hidden' || visibility === 'frozen') {
        return { ...base, categories: [] }
    }
    const filter = pb.filter('competition = {:id}', { id: competition.id })
    const options = { filter, batch: 1000, requestKey: null }
    const [categories, entries, routes, scores] = await Promise.all([
        pb
            .collection('competition_categories')
            .getFullList<ResultsInput['categories'][number]>({
                ...options,
                sort: 'sort,name',
            }),
        staff
            ? pb
                  .collection('competition_entries')
                  .getFullList<ResultsInput['entries'][number]>({
                      ...options,
                      filter: `${filter} && (status = "registered" || status = "checked_in")`,
                  })
            : pb
                  .collection('competition_standings')
                  .getFullList<ResultsInput['entries'][number]>(options),
        pb
            .collection('competition_routes')
            .getFullList<ResultsInput['routes'][number]>(options),
        pb
            .collection('competition_scores')
            .getFullList<ResultsInput['scores'][number]>(options),
    ])
    return {
        ...base,
        categories: buildStandings({
            competition,
            categories,
            entries,
            routes,
            scores,
        }),
    }
}

export const PUBLIC_RESULTS_CACHE_MS = 5_000
export const MIN_RECOMPUTE_MS = 1_000

export function cachedResultsUsable(
    cachedAt: number,
    now: number,
    changedAt: number,
) {
    const age = now - cachedAt
    if (age < MIN_RECOMPUTE_MS) return true
    const outdatedByChange = changedAt > cachedAt && changedAt <= now
    return age < PUBLIC_RESULTS_CACHE_MS && !outdatedByChange
}
