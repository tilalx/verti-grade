import { writeSsrCache } from '../utils/ssrCache'
import { ssrCacheRequest } from '../utils/ssrCacheRequest'

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('render:response', (response, { event }) => {
        if (response.statusCode && response.statusCode !== 200) return
        const { cacheable, key, ttlMs } = ssrCacheRequest(event)
        if (!cacheable || typeof response.body !== 'string') return
        writeSsrCache(key, response.body, ttlMs)
    })
})
