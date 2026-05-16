import { createPocketBase } from './pb-server.js'

export interface TenantInfo {
    id: string
    name: string
    slug: string
}

export async function resolveTenantFromHost(host: string): Promise<TenantInfo | null> {
    if (!host) return null
    const clean = host.split(':')[0].replace(/[^a-zA-Z0-9.\-]/g, '')
    if (!clean) return null
    const pb = createPocketBase()
    try {
        const data = await pb.send(
            `/api/tenant-by-domain?domain=${encodeURIComponent(clean)}`,
            { method: 'GET' },
        )
        return data as TenantInfo
    } catch {
        return null
    }
}
