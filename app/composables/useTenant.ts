export interface TenantInfo {
    id: string
    name: string
    slug: string
}

export function useTenant() {
    // Populated by useAsyncData('tenant', ...) in layouts/default.vue (SSR + hydration)
    const { data: tenant } = useNuxtData<TenantInfo | null>('tenant')

    const tenantId = computed<string | null>(() => tenant.value?.id ?? null)

    // Use this as the base filter in every PocketBase query.
    // Falls back to a never-match filter so UI shows nothing instead of all tenants.
    const tenantFilter = computed<string>(() =>
        tenantId.value ? `tenant_id = "${tenantId.value}"` : 'id = "___no_tenant___"',
    )

    return { tenant, tenantId, tenantFilter }
}
