import { describe, expect, it } from 'vitest'
import type { MapPoint } from '#shared/utils/mapGeometry'
import { closestPairDistance, clusterDots, spreadAround } from '~/utils/gymMap'

const dot = (routeId: string, point: MapPoint) => ({ routeId, point })

describe('clusterDots', () => {
    it('keeps far apart dots single', () => {
        const clusters = clusterDots([dot('a', [0, 0]), dot('b', [5, 0])], 1)
        expect(clusters.map((cluster) => cluster.key)).toEqual(['a', 'b'])
    })

    it('groups close dots and centers the cluster between them', () => {
        const [cluster] = clusterDots([dot('b', [0, 0]), dot('a', [0.5, 0])], 1)
        expect(cluster!.key).toBe('a,b')
        expect(cluster!.point).toEqual([0.25, 0])
    })

    it('splits a long chain of close dots into bounded clusters', () => {
        const chain = Array.from({ length: 30 }, (_, index) =>
            dot(`r${index}`, [index * 0.4, 0]),
        )
        const clusters = clusterDots(chain, 1)
        expect(clusters.length).toBeGreaterThan(5)
        for (const { dots } of clusters)
            expect(dots.at(-1)!.point[0] - dots[0]!.point[0]).toBeLessThan(1)
        expect(clusters.flatMap((cluster) => cluster.dots)).toHaveLength(30)
    })

    it('groups routes at the identical spot', () => {
        expect(
            clusterDots([dot('a', [3, 3]), dot('b', [3, 3])], 0.1),
        ).toHaveLength(1)
    })
})

describe('closestPairDistance', () => {
    it('finds the smallest gap', () => {
        expect(
            closestPairDistance([
                [0, 0],
                [3, 0],
                [3, 0.5],
            ]),
        ).toBe(0.5)
    })
})

describe('spreadAround', () => {
    it.each([2, 3, 8])(
        'keeps %i spread dots at least spacing apart',
        (count) => {
            const points = spreadAround([10, 10], count, 1)
            expect(points).toHaveLength(count)
            expect(closestPairDistance(points)).toBeGreaterThanOrEqual(0.999)
        },
    )
})
