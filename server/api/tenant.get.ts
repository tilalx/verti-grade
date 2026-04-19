import { getQuery, getHeader } from 'h3'
import { resolveTenantFromHost } from '../utils/tenant.js'

export default defineEventHandler(async (event) => {
    // Prefer explicit ?host= query param (SSR internal fetches don't reliably
    // forward the Host header through Nitro's internal routing layer).
    const query = getQuery(event)
    const host = (query.host as string) || getHeader(event, 'host') || ''
    return await resolveTenantFromHost(host)
})
