<template>
    <a href="#main-content" class="skip-link">{{ $t('nav.skipToContent') }}</a>
    <LayoutNavBar :loggedIn="isLoggedIn" :settings="settings" />
    <div class="page-body">
        <v-main id="main-content" tabindex="-1">
            <NuxtPage />
        </v-main>
        <LayoutFootBar :settings="settings" />
    </div>
    <GlobalSnackbar />
</template>

<script setup>
const pb = usePocketbase()
const isLoggedIn = ref(pb.authStore.isValid)
const { refreshPermissions } = usePermissions()

// ── Tenant detection (SSR-safe, keyed by hostname) ────────────────────────
// Pass hostname as a query param — internal Nitro $fetch calls don't reliably
// forward the Host header, so header-based forwarding breaks in SSR.
const requestUrl = useRequestURL()
const { data: tenantData } = await useAsyncData(
    'tenant',
    async () => (await $fetch('/api/tenant', { query: { host: requestUrl.hostname } })) ?? null,
    { lazy: false },
)

// ── Auth-based tenant fallback ────────────────────────────────────────────
// If domain resolution returns null (e.g. localhost dev with multiple tenants),
// and the user is authenticated, resolve the tenant from their membership.
// Runs client-only; picks the user's first active tenant membership.
async function resolveTenantFromAuth() {
    if (tenantData.value) return
    if (!pb.authStore.isValid) return
    try {
        const tu = await pb
            .collection('tenant_users')
            .getFirstListItem(`user_id = "${pb.authStore.record?.id}"`, {
                expand: 'tenant_id',
                sort: 'created',
            })
        const t = tu?.expand?.tenant_id
        if (t?.id) {
            tenantData.value = { id: t.id, name: t.name, slug: t.slug }
        }
    } catch {
        // no membership → leave as null
    }
}

// ── Per-tenant settings ───────────────────────────────────────────────────
const getSettings = async () => {
    const tenantId = tenantData.value?.id
    if (!tenantId) return {}
    try {
        return await pb
            .collection('settings')
            .getFirstListItem(`tenant_id = "${tenantId}"`)
    } catch (error) {
        if (error?.data?.code === 404 || error?.status === 404) {
            return {}
        }
        console.error('An error occurred fetching settings:', error)
        return {}
    }
}

const { data: settingsData, refresh: refreshSettings } = await useAsyncData(
    'settings',
    getSettings,
    { lazy: true },
)

const settings = ref(settingsData.value ?? {})
watch(settingsData, (val) => {
    if (val) settings.value = val
})

// Re-fetch settings if the tenant changes (e.g., during dev HMR)
watch(
    () => tenantData.value?.id,
    async (id) => {
        if (id) await refreshSettings()
    },
)

const refreshSession = async () => {
    try {
        await pb.collection('users').authRefresh()
        isLoggedIn.value = pb.authStore.isValid
    } catch (error) {
        pb.authStore.clear()
        isLoggedIn.value = false
        console.error('Error refreshing session:', error)
    }
}

const setFavicon = () => {
    if (!settings.value?.page_icon) return
    const favUrl = pb.files.getURL(settings.value, settings.value.page_icon)
    let link =
        document.querySelector("link[rel~='icon']") ||
        document.createElement('link')
    link.rel = 'icon'
    link.href = favUrl
    document.head.appendChild(link)
}

let unsubAuthChange = null
let unsubUser = null
let unsubSettings = null
let unsubRole = null

async function subscribeToRole(roleId) {
    unsubRole?.()?.catch?.(() => {})
    if (!roleId) return
    unsubRole = await pb.collection('roles').subscribe(roleId, (e) => {
        if (e.action === 'update') refreshPermissions()
    })
}

async function subscribeToUser(userId) {
    unsubUser?.()
    unsubUser = await pb.collection('users').subscribe(userId, (e) => {
        if (e.action === 'delete') {
            pb.authStore.clear()
        } else {
            const oldRole = pb.authStore.record?.role
            pb.authStore.save(pb.authStore.token, e.record)
            isLoggedIn.value = true
            if (e.record.role !== oldRole) {
                refreshPermissions()
                subscribeToRole(e.record.role)
            }
        }
    })
}

onMounted(async () => {
    try {
        if (pb.authStore.isValid) {
            await refreshSession()
            await refreshPermissions()
        }
        await resolveTenantFromAuth()
        setFavicon()

        unsubAuthChange = pb.authStore.onChange(async (token, record) => {
            isLoggedIn.value = !!token
            if (token && record?.id) {
                subscribeToUser(record.id)
                refreshPermissions()
                await resolveTenantFromAuth()
            } else {
                unsubUser?.()
                unsubUser = null
                refreshPermissions()
            }
        })

        if (pb.authStore.isValid && pb.authStore.record?.id) {
            await subscribeToUser(pb.authStore.record.id)
        }

        if (pb.authStore.isValid && pb.authStore.record?.role) {
            await subscribeToRole(pb.authStore.record.role)
        }

        // Subscribe to per-tenant settings for realtime branding sync
        const settingsRecord = settings.value
        if (settingsRecord?.id) {
            unsubSettings = await pb
                .collection('settings')
                .subscribe(settingsRecord.id, (e) => {
                    settings.value = e.record
                    setFavicon()
                })
        }
    } catch (error) {
        console.error('Error during initialization:', error)
    }
})

onBeforeUnmount(() => {
    unsubAuthChange?.()
    unsubUser?.()?.catch?.(() => {})
    unsubRole?.()?.catch?.(() => {})
    unsubSettings?.()?.catch?.(() => {})
})
</script>

<style scoped>
.page-body {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
}

.page-body :deep(.v-main) {
    flex: 1 0 auto;
}

.skip-link {
    position: absolute;
    top: -100%;
    left: 16px;
    z-index: 9999;
    padding: 8px 16px;
    background: rgb(var(--v-theme-primary));
    color: #fff;
    border-radius: 0 0 8px 8px;
    font-weight: 600;
    font-size: 0.875rem;
    text-decoration: none;
    transition: top 0.2s ease;
}

.skip-link:focus {
    top: 0;
}
</style>
