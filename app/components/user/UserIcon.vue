<template>
    <v-menu
        v-model="menuOpen"
        :close-on-content-click="false"
        location="bottom end"
        offset="8"
        transition="scale-transition"
        min-width="220"
    >
        <template #activator="{ props: menuProps }">
            <v-btn
                v-bind="menuProps"
                icon
                variant="text"
                class="mr-2"
                aria-label="Open user menu"
            >
                <v-avatar size="36" :color="image ? undefined : 'primary'">
                    <v-img v-if="image" :src="image" :alt="displayName" cover />
                    <span v-else class="text-subtitle-2 font-weight-bold">{{ initials }}</span>
                </v-avatar>
            </v-btn>
        </template>

        <v-card rounded="xl" elevation="3" border>
            <v-list density="compact" nav class="py-2">
                <v-list-item
                    v-for="item in menuItems"
                    :key="item.key"
                    :prepend-icon="item.icon"
                    :title="item.title"
                    :base-color="item.color"
                    :disabled="item.disabled"
                    rounded="lg"
                    @click="handleAction(item)"
                />
            </v-list>
        </v-card>
    </v-menu>

    <EditUserSelf
        v-if="user"
        v-model:dialog-open="dialogOpen"
        :user-id="user.id"
    />
</template>

<script setup>
import EditUserSelf from './EditUserSelf.vue'

const router = useRouter()
const pb = usePocketbase()
const { t } = useI18n()

// ── Auth state ────────────────────────────────────────────────────────────────

const user = computed(() => {
    try {
        return JSON.parse(localStorage.getItem('pocketbase_auth') ?? '{}')?.record ?? null
    } catch {
        return null
    }
})

const image = computed(() => {
    if (!user.value?.avatar) return null
    return pb.files.getURL(user.value, user.value.avatar, { thumb: '100x100' })
})

const displayName = computed(() =>
    user.value?.name || user.value?.username || user.value?.email || t('account.unknownUser')
)

const initials = computed(() => {
    const name = displayName.value
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() ?? '')
        .join('')
})

// ── UI state ──────────────────────────────────────────────────────────────────

const menuOpen = ref(false)
const dialogOpen = ref(false)
const isLoggingOut = ref(false)

// ── Menu items ────────────────────────────────────────────────────────────────

const menuItems = computed(() => [
    {
        key: 'profile',
        title: t('account.profile'),
        icon: 'mdi-account-edit-outline',
        action: () => {
            dialogOpen.value = true
            menuOpen.value = false
        },
    },
    {
        key: 'logout',
        title: t('account.logout'),
        icon: 'mdi-logout-variant',
        color: 'error',
        loading: isLoggingOut.value,
        disabled: isLoggingOut.value,
        action: logout,
    },
])

// ── Actions ───────────────────────────────────────────────────────────────────

function handleAction(item) {
    item.action?.()
}

async function logout() {
    if (isLoggingOut.value) return
    try {
        isLoggingOut.value = true
        pb.authStore.clear()
        await router.push('/auth/login')
    } finally {
        isLoggingOut.value = false
    }
}
</script>