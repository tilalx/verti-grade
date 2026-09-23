import { describe, expect, it, vi } from 'vitest'

vi.mock('h3', () => ({
    createError: (input: unknown) => input,
    eventHandler: (handler: unknown) => handler,
}))
vi.mock('../../server/utils/pb-server', () => ({
    getAuthenticatedPb: vi.fn(),
}))

const { mapMonthly } = await import('../../server/api/manage/analytics.get')

describe('mapMonthly', () => {
    it('sums daily counts per month in order', () => {
        expect(
            mapMonthly([
                { period: '2024-01-03', count: 2 },
                { period: '2024-01-20', count: 1 },
                { period: '2024-03-01', count: 4 },
            ]),
        ).toEqual([
            { period: '2024-01', count: 3 },
            { period: '2024-03', count: 4 },
        ])
    })
})
