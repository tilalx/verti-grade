import PocketBase from 'pocketbase'

export const usePocketbase = () => {
    if (process.server) {
        const url = import.meta.dev
            ? 'http://localhost:8090'
            : 'http://localhost:8080'
        return new PocketBase(url)
    }

    if (!globalThis._pb) {
        const url = import.meta.dev ? 'http://localhost:8090' : '/'
        const pb = new PocketBase(url)

        // Auto-inject X-Tenant-Id header on every SDK request so the Go hook
        // can enforce tenant membership and auto-set tenant_id server-side.
        pb.beforeSend = (url, options) => {
            const { data: tenant } = useNuxtData('tenant')
            if (tenant.value?.id) {
                options.headers = {
                    ...options.headers ?? {},
                    'X-Tenant-Id': tenant.value.id,
                }
            }
            return { url, options }
        }

        globalThis._pb = pb
    }

    return globalThis._pb
}
