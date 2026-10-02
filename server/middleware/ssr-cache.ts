import { readSsrCache } from '../utils/ssrCache'
import { ssrCacheRequest } from '../utils/ssrCacheRequest'

export default defineEventHandler((event) => {
    const { cacheable, key } = ssrCacheRequest(event)
    if (!cacheable) return
    const hit = readSsrCache(key)
    if (!hit) return
    setHeader(event, 'content-type', 'text/html;charset=utf-8')
    setHeader(event, 'x-ssr-cache', 'hit')
    return hit.body
})
