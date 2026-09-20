<template>
    <a href="#main-content" class="skip-link">{{ $t('nav.skipToContent') }}</a>
    <LayoutNavBar :loggedIn="isLoggedIn" :settings="settings" />
    <div class="page-body">
        <v-main id="main-content" tabindex="-1">
            <NotificationsNewVersionAvailable v-if="isLoggedIn" />
            <NuxtPage />
        </v-main>
        <LayoutFootBar :settings="settings" />
    </div>
    <GlobalSnackbar />
    <!-- The navbar now server-renders, so it's no longer a hydration signal
         for gotoSettled() (e2e/support/nav.ts) — this marker is. -->
    <ClientOnly>
        <div data-testid="page-hydrated" hidden />
    </ClientOnly>
</template>

<script setup>
const pb = usePocketbase()
const isLoggedIn = ref(pb.authStore.isValid)
const { refreshPermissions } = usePermissions()
const { t } = useI18n()
const { error: notifyError } = useNotification()

const getSettings = async () => {
    try {
        return await pb.collection('settings').getOne('settings_123456')
    } catch (error) {
        if (error.data && error.data.code === 404) {
            try {
                return await pb.collection('settings').create({
                    id: 'settings_123456',
                })
            } catch (createError) {
                console.error('Error creating new settings:', createError)
                notifyError(t('settings.initError'))
                throw createError
            }
        }
        console.error('An error occurred:', error)
        notifyError(t('settings.loadError'))
        throw error
    }
}

const { data: settingsData } = await useAsyncData('settings', getSettings)

const settings = ref(settingsData.value ?? {})
watch(settingsData, (val) => {
    if (val) settings.value = val
})

// Resolved during SSR so the navbar's permission-gated links are in the
// server HTML. Transfers via useState payload; onMounted re-verifies.
await callOnce('user-permissions', refreshPermissions)

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

// Rendered into the SSR'd <head>, so the custom icon is the first one the
// browser sees instead of a post-hydration swap.
useHead(
    computed(() => ({
        link: [
            {
                rel: 'icon',
                href: settings.value?.page_icon
                    ? usePbFileUrl(settings.value, settings.value.page_icon)
                    : '/favicon.ico',
            },
        ],
    })),
)

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
            // If the user's role changed, refresh permissions and resubscribe
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
        }
        // Always resolve permissions, even when logged out — refreshPermissions()
        // handles the anonymous case itself (empty permissions, loaded=true).
        // Skipping this for anonymous visitors left `can()`'s fail-open default
        // in effect forever, showing every admin nav link to logged-out users.
        await refreshPermissions()

        // Reflect any local auth store changes immediately (login/logout on this tab)
        unsubAuthChange = pb.authStore.onChange((token, record) => {
            isLoggedIn.value = !!token
            if (token && record?.id) {
                subscribeToUser(record.id)
                refreshPermissions()
            } else {
                unsubUser?.()
                unsubUser = null
                refreshPermissions()
            }
        })

        // Subscribe to current user record for cross-device auth sync
        if (pb.authStore.isValid && pb.authStore.record?.id) {
            await subscribeToUser(pb.authStore.record.id)
        }

        // Subscribe to role changes for realtime permission updates
        if (pb.authStore.isValid && pb.authStore.record?.role) {
            await subscribeToRole(pb.authStore.record.role)
        }

        // Realtime settings sync across devices
        unsubSettings = await pb
            .collection('settings')
            .subscribe('settings_123456', (e) => {
                settings.value = e.record
            })
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

/*
 * Vuetify's v-main padding-top (offsetting the fixed app-bar) is computed
 * client-side by its layout system once the app-bar registers its height,
 * so server-rendered HTML has no top padding — content briefly renders
 * behind the navbar until hydration applies the inline style. This fallback
 * matches NavBar.vue's hardcoded app-bar height so first paint is correct;
 * Vuetify's own inline style takes over (and matches) once hydrated.
 */
#main-content {
    padding-top: 64px;
}
</style>
