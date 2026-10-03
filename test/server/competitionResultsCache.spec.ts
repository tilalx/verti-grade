import { describe, expect, it } from 'vitest'
import {
    cachedResultsUsable,
    MIN_RECOMPUTE_MS,
    PUBLIC_RESULTS_CACHE_MS,
} from '../../server/utils/competitionResults'

describe('cachedResultsUsable', () => {
    it('serves the cache while it is fresh', () => {
        expect(cachedResultsUsable(1_000, 2_000, 0)).toBe(true)
        expect(
            cachedResultsUsable(1_000, 1_000 + PUBLIC_RESULTS_CACHE_MS, 0),
        ).toBe(false)
    })

    it('recomputes when a change happened after the cache was built', () => {
        expect(cachedResultsUsable(1_000, 2_500, 1_500)).toBe(false)
        expect(cachedResultsUsable(1_000, 2_500, 900)).toBe(true)
    })

    it('recomputes at most once per second however often changes arrive', () => {
        expect(
            cachedResultsUsable(1_000, 1_000 + MIN_RECOMPUTE_MS - 1, 1_500),
        ).toBe(true)
    })

    it('ignores change times from the future', () => {
        expect(cachedResultsUsable(1_000, 2_500, 99_000)).toBe(true)
    })
})
