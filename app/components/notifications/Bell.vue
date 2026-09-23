<template>
    <v-menu
        v-if="isLoggedIn"
        v-model="open"
        :close-on-content-click="false"
        location="bottom end"
        offset="8"
        min-width="320"
        max-width="380"
    >
        <template #activator="{ props: activatorProps }">
            <v-btn
                v-bind="activatorProps"
                icon
                variant="text"
                size="small"
                :class="['nav-bell', { 'nav-bell--active': unreadCount }]"
                :aria-label="$t('notifications.center.title')"
                data-testid="notification-bell"
            >
                <v-badge
                    :model-value="unreadCount > 0"
                    color="error"
                    offset-x="-2"
                    offset-y="-2"
                >
                    <template #badge>
                        <span data-testid="notification-badge">{{
                            unreadCount
                        }}</span>
                    </template>
                    <v-icon size="20">mdi-bell-outline</v-icon>
                </v-badge>
            </v-btn>
        </template>

        <v-card data-testid="notification-menu">
            <div
                class="d-flex align-center justify-space-between px-4 py-3 ga-2"
            >
                <span class="text-title-small font-weight-bold">
                    {{ $t('notifications.center.title') }}
                </span>
                <v-btn
                    v-if="unreadCount"
                    variant="text"
                    size="small"
                    class="text-none"
                    data-testid="notification-mark-all"
                    @click="markAllRead"
                >
                    {{ $t('notifications.center.markAllRead') }}
                </v-btn>
            </div>

            <v-divider />

            <v-list
                density="compact"
                max-height="400"
                class="notification-list"
            >
                <v-list-item
                    v-if="!items.length"
                    data-testid="notification-empty"
                >
                    <v-list-item-title
                        class="text-body-medium text-medium-emphasis"
                    >
                        {{ $t('notifications.center.empty') }}
                    </v-list-item-title>
                </v-list-item>

                <v-list-item
                    v-for="item in items"
                    :key="item.id"
                    :class="{ 'notification-item--unread': !item.read }"
                    :data-testid="`notification-item-${item.id}`"
                    @click="openItem(item)"
                >
                    <template #prepend>
                        <v-icon
                            size="18"
                            :color="item.read ? 'medium-emphasis' : 'primary'"
                        >
                            {{
                                item.read ? 'mdi-circle-outline' : 'mdi-circle'
                            }}
                        </v-icon>
                    </template>

                    <v-list-item-title
                        class="text-body-medium notification-item__title"
                    >
                        {{ label(item) }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-body-small">
                        {{ timeAgo(item.created, $t, locale) }}
                    </v-list-item-subtitle>

                    <template #append>
                        <v-btn
                            icon
                            size="x-small"
                            variant="text"
                            :aria-label="$t('notifications.center.dismiss')"
                            :title="$t('notifications.center.dismiss')"
                            data-testid="notification-dismiss"
                            @click.stop="dismiss(item.id)"
                        >
                            <v-icon size="16">mdi-close</v-icon>
                        </v-btn>
                    </template>
                </v-list-item>
            </v-list>
        </v-card>
    </v-menu>
</template>

<script setup>
import { timeAgo } from '#shared/utils/formatting'

const { t, locale } = useI18n()
const pb = usePocketbase()
const { subscribe } = usePbSubscription()
const { items, unreadCount, refresh, markRead, markAllRead, dismiss } =
    useNotificationQueue()

const open = ref(false)
const isLoggedIn = ref(false)

function label(item) {
    return t(`notifications.center.types.${item.type}`, item.params ?? {})
}

async function openItem(item) {
    await markRead(item.id)
    if (item.url) {
        open.value = false
        await navigateTo(item.url)
    }
}

onMounted(async () => {
    isLoggedIn.value = pb.authStore.isValid
    if (!isLoggedIn.value) return

    await refresh()
    await subscribe('notifications', () => void refresh())
})
</script>

<style scoped>
.nav-bell {
    opacity: 0.8;
}

.nav-bell:hover,
.nav-bell--active {
    opacity: 1;
}

.notification-item--unread {
    background: rgba(var(--v-theme-primary), 0.06);
}

.notification-item__title {
    white-space: normal;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
