import type { H3Event } from 'h3'
import { joinRender, readSsrCache, withCacheAge } from '../utils/ssrCache'
import { ssrCacheRequest } from '../utils/ssrCacheRequest'

function sendCached(event: H3Event, body: string, ageMs: number) {
    setHeader(event, 'content-type', 'text/html;charset=utf-8')
    setHeader(event, 'x-ssr-cache', 'hit')
    setHeader(event, 'accept-ch', 'Sec-CH-Viewport-Width')
    return withCacheAge(body, ageMs)
}

export default defineEventHandler(async (event) => {
    const { cacheable, key } = ssrCacheRequest(event)
    if (!cacheable) return
    const hit = readSsrCache(key)
    if (hit) return sendCached(event, hit.body, Date.now() - hit.created)
    const render = joinRender(key)
    if (render.leader) {
        event.context.ssrCacheLeader = key
        return
    }
    const body = await render.result
    if (body) return sendCached(event, body, 0)
})
