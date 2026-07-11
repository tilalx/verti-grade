import { describe, it, expect } from 'vitest'
import { toPbSort } from '~/utils/sorting'

describe('toPbSort', () => {
    it('returns the default sort when no array is given', () => {
        expect(toPbSort([])).toBe('-created')
    })

    it('respects a custom default sort', () => {
        expect(toPbSort([], '-screw_date')).toBe('-screw_date')
    })

    it('converts a single desc sort to a prefixed key', () => {
        expect(toPbSort([{ key: 'name', order: 'desc' }])).toBe('-name')
    })

    it('converts a single asc sort to a plain key', () => {
        expect(toPbSort([{ key: 'name', order: 'asc' }])).toBe('name')
    })

    it('joins multiple sort fields with commas', () => {
        expect(
            toPbSort([
                { key: 'difficulty', order: 'asc' },
                { key: 'name', order: 'desc' },
            ]),
        ).toBe('difficulty,-name')
    })

    it('treats a missing order as ascending (no dash prefix)', () => {
        expect(toPbSort([{ key: 'name' }])).toBe('name')
    })

    it('returns the default sort when called with undefined', () => {
        // @ts-expect-error intentional bad input
        expect(toPbSort(undefined)).toBe('-created')
    })

    it('returns the default sort when called with null', () => {
        // @ts-expect-error intentional bad input
        expect(toPbSort(null)).toBe('-created')
    })

    it('maps column keys to field names via keyMap', () => {
        expect(
            toPbSort([{ key: 'score', order: 'asc' }], '-created', {
                score: 'average_rating',
            }),
        ).toBe('average_rating')
    })

    it('keeps the desc prefix on mapped keys', () => {
        expect(
            toPbSort([{ key: 'score', order: 'desc' }], '-created', {
                score: 'average_rating',
            }),
        ).toBe('-average_rating')
    })

    it('leaves keys not present in keyMap untouched', () => {
        expect(
            toPbSort(
                [
                    { key: 'name', order: 'asc' },
                    { key: 'score', order: 'desc' },
                ],
                '-created',
                { score: 'average_rating' },
            ),
        ).toBe('name,-average_rating')
    })
})
