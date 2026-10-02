export const SSR_CACHED_PATHS = new Set(['/', '/routes', '/map', '/route'])

export interface SsrCacheEntry {
    body: string
    expires: number
}

export function ssrCacheTtlMs(env = process.env) {
    return Math.max(0, Number(env.SSR_CACHE_SECONDS || 0)) * 1000
}

export function isSsrCacheable(request: {
    method: string
    pathname: string
    hasAuthCookie: boolean
    ttlMs: number
}) {
    return (
        request.ttlMs > 0 &&
        request.method === 'GET' &&
        !request.hasAuthCookie &&
        SSR_CACHED_PATHS.has(request.pathname)
    )
}

export function ssrCacheKey(
    pathname: string,
    search: string,
    acceptLanguage: string | undefined,
) {
    const lang = (acceptLanguage || '').split(',')[0]?.trim().slice(0, 2) || ''
    return `${lang}|${pathname}${search}`
}

// ponytail: one in-memory map per Node process, capped by entry count; move to a shared store if Nuxt ever runs more than one instance
const MAX_ENTRIES = 500
export const ssrCache = new Map<string, SsrCacheEntry>()

export function readSsrCache(key: string, now = Date.now()) {
    const entry = ssrCache.get(key)
    if (!entry) return null
    if (entry.expires <= now) {
        ssrCache.delete(key)
        return null
    }
    return entry
}

export function writeSsrCache(key: string, body: string, ttlMs: number) {
    ssrCache.set(key, { body, expires: Date.now() + ttlMs })
    while (ssrCache.size > MAX_ENTRIES)
        ssrCache.delete(ssrCache.keys().next().value as string)
}
