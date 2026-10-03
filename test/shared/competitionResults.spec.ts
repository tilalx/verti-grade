import { describe, expect, it } from 'vitest'
import {
    buildStandings,
    resultsVisibility,
} from '#shared/utils/competitionResults'

describe('resultsVisibility', () => {
    const base = {
        status: 'open',
        live_ranking: true,
        freeze_at: '2026-10-10 13:45:00.000Z',
    }

    it('is live until the freeze, then frozen until published', () => {
        expect(resultsVisibility(base, new Date('2026-10-10T13:00:00Z'))).toBe(
            'live',
        )
        expect(resultsVisibility(base, new Date('2026-10-10T13:46:00Z'))).toBe(
            'frozen',
        )
        expect(
            resultsVisibility(
                { ...base, status: 'closed' },
                new Date('2026-10-10T15:00:00Z'),
            ),
        ).toBe('frozen')
        expect(
            resultsVisibility(
                { ...base, status: 'published' },
                new Date('2026-10-10T15:00:00Z'),
            ),
        ).toBe('final')
    })

    it('stays hidden without live ranking or in draft', () => {
        const now = new Date('2026-10-10T13:00:00Z')
        expect(resultsVisibility({ ...base, live_ranking: false }, now)).toBe(
            'hidden',
        )
        expect(resultsVisibility({ ...base, status: 'draft' }, now)).toBe(
            'hidden',
        )
        expect(resultsVisibility({ ...base, freeze_at: '' }, now)).toBe('live')
    })
})

describe('buildStandings', () => {
    it('ranks each category on its own pool', () => {
        const standings = buildStandings({
            competition: { scoring_format: 'dynamic' },
            categories: [
                { id: 'f', name: 'Female' },
                { id: 'm', name: 'Male' },
            ],
            entries: [
                { id: 'a', category: 'f', bib: 1, display_name: 'Anna' },
                { id: 'b', category: 'f', bib: 2, display_name: '' },
                { id: 'c', category: 'm', bib: 3, display_name: 'Carl' },
            ],
            routes: [{ id: 'r1', zone: true }],
            scores: [
                { entry: 'a', comp_route: 'r1', attempts: 1, top_attempt: 1 },
                { entry: 'b', comp_route: 'r1', attempts: 2, top_attempt: 2 },
                { entry: 'c', comp_route: 'r1', attempts: 1, top_attempt: 1 },
            ],
        })
        expect(
            standings.map((category) => [
                category.name,
                category.rows.map((row) => [row.bib, row.rank, row.points]),
            ]),
        ).toEqual([
            [
                'Female',
                [
                    [1, 1, 500],
                    [2, 2, 500],
                ],
            ],
            ['Male', [[3, 1, 1000]]],
        ])
        expect(standings[0]!.rows[1]!.name).toBe('')
    })
})
