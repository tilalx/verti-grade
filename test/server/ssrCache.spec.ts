import { beforeEach, describe, expect, it } from 'vitest'
import {
    isSsrCacheable,
    readSsrCache,
    ssrCache,
    ssrCacheKey,
    ssrCacheTtlMs,
    writeSsrCache,
} from '../../server/utils/ssrCache'

describe('ssr cache', () => {
    beforeEach(() => ssrCache.clear())

    it('is off unless SSR_CACHE_SECONDS is set', () => {
        expect(ssrCacheTtlMs({})).toBe(0)
        expect(ssrCacheTtlMs({ SSR_CACHE_SECONDS: '5' })).toBe(5000)
        expect(ssrCacheTtlMs({ SSR_CACHE_SECONDS: '-1' })).toBe(0)
    })

    it('only caches guest GETs of the public pages', () => {
        const base = {
            method: 'GET',
            pathname: '/routes',
            hasAuthCookie: false,
            ttlMs: 5000,
        }
        expect(isSsrCacheable(base)).toBe(true)
        expect(isSsrCacheable({ ...base, hasAuthCookie: true })).toBe(false)
        expect(isSsrCacheable({ ...base, pathname: '/logbook' })).toBe(false)
        expect(isSsrCacheable({ ...base, method: 'POST' })).toBe(false)
        expect(isSsrCacheable({ ...base, ttlMs: 0 })).toBe(false)
    })

    it('keys by language, path and query', () => {
        expect(ssrCacheKey('/route', '?id=a', 'de-DE,de;q=0.9')).toBe(
            'de|/route?id=a',
        )
        expect(ssrCacheKey('/', '', undefined)).toBe('|/')
    })

    it('expires entries and caps the map', () => {
        writeSsrCache('k', '<html>', 1000)
        expect(readSsrCache('k', Date.now())?.body).toBe('<html>')
        expect(readSsrCache('k', Date.now() + 1001)).toBeNull()
        for (let i = 0; i < 600; i++) writeSsrCache(`k${i}`, '', 1000)
        expect(ssrCache.size).toBe(500)
    })
})
