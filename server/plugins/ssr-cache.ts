import { finishRender, writeSsrCache } from '../utils/ssrCache'
import { ssrCacheRequest } from '../utils/ssrCacheRequest'

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('render:response', (response, { event }) => {
        const leaderKey = event.context.ssrCacheLeader as string | undefined
        const ok =
            (!response.statusCode || response.statusCode === 200) &&
            typeof response.body === 'string'
        const { cacheable, key, ttlMs } = ssrCacheRequest(event)
        if (ok && cacheable) writeSsrCache(key, response.body as string, ttlMs)
        if (leaderKey)
            finishRender(leaderKey, ok ? (response.body as string) : null)
    })

    nitroApp.hooks.hook('afterResponse', (event) => {
        const leaderKey = event.context.ssrCacheLeader as string | undefined
        if (leaderKey) finishRender(leaderKey, null)
    })
})
