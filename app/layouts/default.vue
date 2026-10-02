<template>
    <a href="#main-content" class="skip-link">{{ $t('nav.skipToContent') }}</a>
    <div class="app-frame">
        <LayoutSideBar :loggedIn="isLoggedIn" :settings="settings" />
        <div class="page-body">
            <LayoutNavBar :loggedIn="isLoggedIn" :settings="settings" />
            <main id="main-content" class="app-main" tabindex="-1">
                <NotificationsNewVersionAvailable v-if="isLoggedIn" />
                <slot />
            </main>
            <LayoutFootBar :settings="settings" />
        </div>
    </div>
    <LayoutBottomNav />
    <div v-if="hydrated" data-testid="page-hydrated" hidden />
</template>

<script setup lang="ts">
import type { ClientResponseError, UnsubscribeFunc } from 'pocketbase'
import type { SettingsRecord } from '~/types/models'

const hydrated = useHydrated()

const pb = usePocketbase()
const isLoggedIn = ref(pb.authStore.isValid)
const { refreshPermissions } = usePermissions()
const { t } = useI18n()
const { error: notifyError } = useNotification()

const getSettings = async () => {
    try {
        return await pb
            .collection('settings')
            .getOne<SettingsRecord>('settings_123456')
    } catch (error) {
        if ((error as ClientResponseError).status === 404) {
            try {
                return await pb.collection('settings').create<SettingsRecord>({
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

const settings = ref<Partial<SettingsRecord>>(settingsData.value ?? {})
watch(settingsData, (val) => {
    if (val) settings.value = val
})

await callOnce('user-permissions', refreshPermissions)

const refreshSession = async () => {
    try {
        await pb.collection('users').authRefresh()
        isLoggedIn.value = pb.authStore.isValid
    } catch (error) {
        const status = (error as ClientResponseError)?.status
        if (status !== 401 && status !== 403) return
        pb.authStore.clear()
        isLoggedIn.value = false
    }
}

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

let unsubAuthChange: (() => void) | null = null
let unsubUser: UnsubscribeFunc | null = null
let unsubSettings: UnsubscribeFunc | null = null
let unsubRole: UnsubscribeFunc | null = null
let unmounted = false

function releaseIfUnmounted(unsub: UnsubscribeFunc): UnsubscribeFunc | null {
    if (!unmounted) return unsub
    unsub().catch(() => {})
    return null
}

async function subscribeToRole(roleId: string | null | undefined) {
    unsubRole?.()?.catch?.(() => {})
    unsubRole = null
    if (!roleId) return
    unsubRole = releaseIfUnmounted(
        await pb.collection('roles').subscribe(roleId, (e) => {
            if (e.action === 'update' || e.action === 'delete')
                refreshPermissions()
        }),
    )
}

async function subscribeToUser(userId: string) {
    unsubUser?.()?.catch?.(() => {})
    unsubUser = null
    unsubUser = releaseIfUnmounted(
        await pb.collection('users').subscribe(userId, (e) => {
            if (e.action === 'delete') {
                pb.authStore.clear()
            } else {
                const oldRole = pb.authStore.record?.role
                pb.authStore.save(pb.authStore.token, e.record)
                isLoggedIn.value = true
                if (e.record.role !== oldRole) subscribeToRole(e.record.role)
            }
        }),
    )
}

onMounted(async () => {
    try {
        if (pb.authStore.isValid) {
            await refreshSession()
        }
        await refreshPermissions()

        unsubAuthChange = pb.authStore.onChange((token, record) => {
            isLoggedIn.value = !!token
            if (token && record?.id) {
                subscribeToUser(record.id)
            } else {
                unsubUser?.()?.catch?.(() => {})
                unsubUser = null
            }
        })

        if (pb.authStore.isValid && pb.authStore.record?.id) {
            await subscribeToUser(pb.authStore.record.id)
        }

        if (pb.authStore.isValid && pb.authStore.record?.role) {
            await subscribeToRole(pb.authStore.record.role)
        }

        unsubSettings = releaseIfUnmounted(
            await pb
                .collection('settings')
                .subscribe('settings_123456', (e) => {
                    settings.value = e.record as SettingsRecord
                }),
        )
    } catch (error) {
        console.error('Error during initialization:', error)
    }
})

onBeforeUnmount(() => {
    unmounted = true
    unsubAuthChange?.()
    unsubUser?.()?.catch?.(() => {})
    unsubRole?.()?.catch?.(() => {})
    unsubSettings?.()?.catch?.(() => {})
})
</script>

<style scoped>
.app-frame {
    display: flex;
    flex: 1 1 auto;
}

.page-body {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-width: 0;
}

.app-main {
    flex: 1 0 auto;
    padding: 0 env(safe-area-inset-right, 0px)
        calc(var(--app-bottom) + var(--app-bottom-inset, 0px))
        env(safe-area-inset-left, 0px);
}

.skip-link {
    position: absolute;
    top: -100%;
    left: 16px;
    z-index: 9999;
    padding: 8px 16px;
    background: var(--ui-primary);
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
