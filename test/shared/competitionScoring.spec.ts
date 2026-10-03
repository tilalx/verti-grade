import { describe, expect, it } from 'vitest'
import {
    rankCompetition,
    type CompetitionRoute,
    type RouteScore,
} from '#shared/utils/competitionScoring'

const boulders: CompetitionRoute[] = [
    { id: 'b1', points: 100, zone: true },
    { id: 'b2', points: 200, zone: true },
    { id: 'b3', points: 300 },
]

const top = (entry: string, route: string, topAttempt: number): RouteScore => ({
    entry,
    route,
    attempts: topAttempt,
    topAttempt,
})

const zone = (
    entry: string,
    route: string,
    zoneAttempt: number,
    attempts = zoneAttempt,
): RouteScore => ({
    entry,
    route,
    attempts,
    zoneAttempt,
})

const byEntry = (ranked: ReturnType<typeof rankCompetition>) =>
    Object.fromEntries(ranked.map((entry) => [entry.entry, entry]))

describe('rankCompetition', () => {
    it('splits the dynamic pool among everyone who topped a boulder', () => {
        const ranked = rankCompetition(
            ['anna', 'ben', 'cleo'],
            boulders,
            [top('anna', 'b1', 1), top('ben', 'b1', 2), top('anna', 'b3', 3)],
            { format: 'dynamic' },
        )
        expect(
            ranked.map((entry) => [entry.entry, entry.rank, entry.points]),
        ).toEqual([
            ['anna', 1, 1500],
            ['ben', 2, 500],
            ['cleo', 3, 0],
        ])
    })

    it('awards the zone pool only to zone holds and not on top of a top', () => {
        const ranked = byEntry(
            rankCompetition(
                ['anna', 'ben'],
                boulders,
                [
                    top('anna', 'b1', 1),
                    zone('ben', 'b1', 1),
                    zone('ben', 'b3', 1),
                ],
                { format: 'dynamic', topPool: 1000, zonePool: 200 },
            ),
        )
        expect(ranked.anna!.points).toBe(1000)
        expect(ranked.ben!.points).toBe(100)
        expect(ranked.ben!.zones).toBe(1)
    })

    it('reduces fixed points by attempt and keeps the last factor', () => {
        const ranked = byEntry(
            rankCompetition(
                ['anna'],
                boulders,
                [
                    top('anna', 'b1', 1),
                    top('anna', 'b2', 2),
                    top('anna', 'b3', 7),
                ],
                { format: 'fixed' },
            ),
        )
        expect(ranked.anna!.points).toBe(100 + 180 + 240)
    })

    it('scores IFSC 2025 with 25 per top, 10 per zone and 0.1 per extra attempt', () => {
        const ranked = byEntry(
            rankCompetition(
                ['anna'],
                boulders,
                [
                    top('anna', 'b1', 1),
                    top('anna', 'b2', 4),
                    zone('anna', 'b3', 1),
                ],
                { format: 'ifsc' },
            ),
        )
        expect(ranked.anna!.points).toBe(49.7)
    })

    it('adds the IFSC zone for a zone-only boulder after failed attempts', () => {
        const zoneBoulder: CompetitionRoute[] = [{ id: 'z', zone: true }]
        const ranked = rankCompetition(
            ['anna'],
            zoneBoulder,
            [zone('anna', 'z', 3, 5)],
            {
                format: 'ifsc',
            },
        )
        expect(ranked[0]!.points).toBe(9.8)
    })

    it('only counts the best N boulders', () => {
        const ranked = rankCompetition(
            ['anna'],
            boulders,
            [top('anna', 'b1', 1), top('anna', 'b2', 1), top('anna', 'b3', 1)],
            { format: 'fixed', bestOf: 2 },
        )
        expect(ranked[0]).toMatchObject({ points: 500, tops: 2 })
    })

    it('ignores voided boulders and scores of other entries', () => {
        const ranked = rankCompetition(
            ['anna'],
            [{ ...boulders[0]!, voided: true }, boulders[1]!],
            [top('anna', 'b1', 1), top('anna', 'b2', 1), top('ghost', 'b2', 1)],
            { format: 'dynamic' },
        )
        expect(ranked[0]).toMatchObject({ points: 1000, tops: 1 })
    })

    it('breaks ties by tops, zones, then fewer attempts and shares equal ranks', () => {
        const ranked = rankCompetition(
            ['anna', 'ben', 'cleo', 'dora'],
            boulders,
            [
                top('anna', 'b1', 1),
                top('ben', 'b1', 1),
                top('cleo', 'b1', 3),
                zone('dora', 'b1', 1),
            ],
            { format: 'dynamic', zonePool: 0 },
        )
        expect(ranked.map((entry) => [entry.entry, entry.rank])).toEqual([
            ['anna', 1],
            ['ben', 1],
            ['cleo', 3],
            ['dora', 4],
        ])
    })

    it('adds a flash bonus to dynamic and fixed points', () => {
        const dynamic = rankCompetition(
            ['anna', 'ben'],
            boulders,
            [top('anna', 'b1', 1), top('ben', 'b1', 2)],
            { format: 'dynamic', flashBonus: 20 },
        )
        expect(byEntry(dynamic).anna!.points).toBe(600)
        expect(byEntry(dynamic).ben!.points).toBe(500)

        const fixed = rankCompetition(
            ['anna'],
            boulders,
            [top('anna', 'b2', 1)],
            { format: 'fixed', flashBonus: 10 },
        )
        expect(fixed[0]!.points).toBe(220)
    })

    it('scales toprope ascents in route collection', () => {
        const ropeRoutes: CompetitionRoute[] = [
            { id: 'r1', points: 100 },
            { id: 'r2', points: 200 },
        ]
        const ranked = rankCompetition(
            ['anna'],
            ropeRoutes,
            [
                { ...top('anna', 'r1', 1), style: 'lead' },
                { ...top('anna', 'r2', 2), style: 'toprope' },
            ],
            { format: 'route_points', topropeFactor: 0.5 },
        )
        expect(ranked[0]!.points).toBe(100 + 90)
    })

    it('ranks classic tops, zones and attempts without points', () => {
        const ranked = rankCompetition(
            ['anna', 'ben', 'cleo'],
            boulders,
            [
                top('anna', 'b1', 2),
                top('anna', 'b2', 1),
                top('ben', 'b1', 1),
                top('ben', 'b2', 1),
                top('cleo', 'b3', 1),
                zone('cleo', 'b1', 1),
            ],
            { format: 'tops' },
        )
        expect(ranked.map((entry) => [entry.entry, entry.rank])).toEqual([
            ['ben', 1],
            ['anna', 2],
            ['cleo', 3],
        ])
        expect(byEntry(ranked).ben!.points).toBe(2)
    })

    it('ranks lead heights with averaged ties and a geometric mean', () => {
        const leadRoutes: CompetitionRoute[] = [
            { id: 'l1', holdCount: 40 },
            { id: 'l2', holdCount: 40 },
        ]
        const height = (
            entry: string,
            route: string,
            value: number,
            heightPlus = false,
        ): RouteScore => ({
            entry,
            route,
            attempts: 1,
            height: value,
            heightPlus,
        })
        const ranked = rankCompetition(
            ['anna', 'ben', 'cleo'],
            leadRoutes,
            [
                height('anna', 'l1', 30, true),
                height('ben', 'l1', 30),
                height('cleo', 'l1', 30),
                height('anna', 'l2', 20),
                height('ben', 'l2', 25),
                height('cleo', 'l2', 20),
            ],
            { format: 'lead_height' },
        )
        expect(
            ranked.map((entry) => [entry.entry, entry.rank, entry.rankPoints]),
        ).toEqual([
            ['anna', 1, 1.581],
            ['ben', 1, 1.581],
            ['cleo', 3, 2.5],
        ])
    })
})
