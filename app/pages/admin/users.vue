<template>
    <v-container fluid class="users-page">
        <!-- ── Page Header ───────────────────────────────────────────────── -->
        <div class="d-flex align-center justify-space-between mb-3">
            <h1 class="text-h5 font-weight-bold">{{ t('users.title') }}</h1>
            <UserCreateUser @user-created="reloadUsers" />
        </div>

        <!-- ── Filter bar ────────────────────────────────────────────────── -->
        <v-card rounded="xl" border flat class="mb-4">
            <v-card-text class="pb-2">
                <div class="d-flex align-center ga-2">
                    <v-text-field
                        v-model="search"
                        :label="t('users.searchUsers')"
                        prepend-inner-icon="mdi-magnify"
                        clearable
                        hide-details
                        density="compact"
                        variant="outlined"
                        rounded="lg"
                        class="flex-grow-1"
                    />
                    <v-select
                        v-model="selectedRole"
                        :label="t('users.role')"
                        :items="roleOptions"
                        item-title="text"
                        item-value="value"
                        clearable
                        hide-details
                        density="compact"
                        variant="outlined"
                        rounded="lg"
                        style="max-width: 180px"
                        class="d-none d-sm-flex"
                    />
                </div>
            </v-card-text>
        </v-card>

        <!-- ── Loading skeletons ─────────────────────────────────────────── -->
        <v-row v-if="loading && !users.length">
            <v-col v-for="i in 6" :key="i" cols="12" sm="6" lg="4">
                <v-skeleton-loader
                    type="list-item-avatar-two-line"
                    rounded="xl"
                />
            </v-col>
        </v-row>

        <!-- ── Empty state ───────────────────────────────────────────────── -->
        <v-card
            v-else-if="!loading && !users.length"
            rounded="xl"
            border
            flat
            class="py-16 text-center"
        >
            <v-icon size="56" color="grey-lighten-2"
                >mdi-account-off-outline</v-icon
            >
            <div class="text-h6 mt-4 text-medium-emphasis">
                {{ t('users.noUsers') }}
            </div>
            <div class="text-body-2 text-disabled mt-1">
                {{ t('users.noUsersHint') }}
            </div>
        </v-card>

        <!-- ── User Cards ────────────────────────────────────────────────── -->
        <v-row v-else>
            <v-col v-for="user in users" :key="user.id" cols="12" sm="6" lg="4">
                <v-card
                    rounded="xl"
                    border
                    flat
                    class="user-card d-flex flex-column"
                >
                    <v-card-item class="pb-1 pt-3">
                        <template #prepend>
                            <v-avatar
                                size="42"
                                :color="
                                    user.avatarUrl
                                        ? undefined
                                        : avatarColor(user.username)
                                "
                            >
                                <v-img
                                    v-if="user.avatarUrl"
                                    :src="user.avatarUrl"
                                    cover
                                />
                                <span
                                    v-else
                                    class="text-caption font-weight-bold text-white"
                                >
                                    {{ initials(user.firstname, user.name) }}
                                </span>
                            </v-avatar>
                        </template>

                        <v-card-title
                            class="text-body-2 font-weight-semibold px-0 py-0"
                            style="line-height: 1.3"
                        >
                            {{
                                [user.firstname, user.name]
                                    .filter(Boolean)
                                    .join(' ') || user.username
                            }}
                        </v-card-title>
                        <v-card-subtitle
                            class="text-caption px-0 py-0"
                            style="opacity: 0.7"
                        >
                            {{ user.username }}
                        </v-card-subtitle>

                        <template #append>
                            <v-chip
                                v-if="user.roleName"
                                size="small"
                                :color="
                                    user.roleName === 'admin'
                                        ? 'primary'
                                        : 'default'
                                "
                                variant="tonal"
                            >
                                {{ user.roleName }}
                            </v-chip>
                        </template>
                    </v-card-item>

                    <v-card-text class="py-2">
                        <div class="text-caption text-disabled">
                            {{ user.email }}
                        </div>
                        <div class="text-caption text-disabled mt-1">
                            {{ t('table.created_at') }}:
                            {{ formatDate(user.created) }}
                        </div>
                    </v-card-text>

                    <v-card-actions class="pt-0 px-2 pb-2">
                        <v-spacer />
                        <v-btn
                            icon
                            size="small"
                            variant="text"
                            @click="editUser(user)"
                        >
                            <v-icon size="18">mdi-pencil-outline</v-icon>
                            <v-tooltip activator="parent" location="top">{{
                                t('actions.edit')
                            }}</v-tooltip>
                        </v-btn>
                        <v-btn
                            icon
                            size="small"
                            variant="text"
                            :disabled="user.id === currentUserId"
                            @click="confirmDelete(user)"
                        >
                            <v-icon size="18" color="error"
                                >mdi-delete-outline</v-icon
                            >
                            <v-tooltip activator="parent" location="top">{{
                                t('actions.delete')
                            }}</v-tooltip>
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>

        <!-- Result count + load more -->
        <div v-if="!loading && users.length" class="text-center mt-4">
            <p class="text-caption text-medium-emphasis mb-3">
                {{ t('users.showing', { n: users.length, total: totalItems }) }}
            </p>
            <v-btn
                v-if="hasMore"
                variant="tonal"
                rounded="lg"
                :loading="loadingMore"
                @click="loadMore"
            >
                {{ t('actions.load_more') }}
            </v-btn>
        </div>

        <!-- ── Edit User Dialog ──────────────────────────────────────────── -->
        <UserEditUser
            :user="editingUser"
            @user-updated="onUserUpdated"
            @close="editingUser = null"
        />

        <!-- ── Delete Confirmation Dialog ────────────────────────────────── -->
        <v-dialog v-model="deleteDialog" max-width="380">
            <v-card rounded="xl">
                <v-card-title
                    class="pa-5 pb-3 text-body-1 font-weight-semibold"
                >
                    {{ t('users.delete') }}
                </v-card-title>
                <v-card-text class="pa-5 pt-0 text-body-2 text-medium-emphasis">
                    {{ t('users.deleteConfirm') }}
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn variant="text" @click="deleteDialog = false">{{
                        t('actions.cancel')
                    }}</v-btn>
                    <v-spacer />
                    <v-btn
                        color="error"
                        variant="flat"
                        :loading="deleting"
                        @click="deleteUser"
                    >
                        {{ t('actions.delete') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- ── Role Permissions Editor ────────────────────────────────────── -->
        <div class="mt-8">
            <AdminRolePermissionsEditor />
        </div>

        <!-- ── Snackbar ──────────────────────────────────────────────────── -->
        <v-snackbar
            v-model="snackbar.show"
            :color="snackbar.color"
            location="top"
            timeout="4000"
        >
            {{ snackbar.message }}
        </v-snackbar>
    </v-container>
</template>

<script setup>
const { t } = useI18n()
const pb = usePocketbase()

useHead({
    title: t('page.title.users'),
    meta: [{ name: 'description', content: t('page.content.users') }],
})

definePageMeta({
    authRequired: true,
    middleware: ['auth'],
    requiredPermission: 'manage_users',
})

// ── State ──────────────────────────────────────────────────────────────────

const loading = ref(true)
const loadingMore = ref(false)
const deleting = ref(false)

const users = ref([])
const page = ref(1)
const PER_PAGE = 48
const totalItems = ref(0)
const hasMore = computed(() => users.value.length < totalItems.value)

const search = ref('')
const selectedRole = ref(null)

const editingUser = ref(null)
const deletingUser = ref(null)
const deleteDialog = ref(false)

const snackbar = reactive({ show: false, message: '', color: 'success' })

const currentUserId = computed(() => pb.authStore.record?.id ?? null)

// ── Roles ─────────────────────────────────────────────────────────────────

const roles = ref([])

const roleOptions = computed(() => [
    { text: t('filter.all'), value: null },
    ...roles.value.map((r) => ({ text: r.name, value: r.id })),
])

async function fetchRoles() {
    try {
        roles.value = await pb.collection('roles').getFullList({
            sort: 'name',
            requestKey: 'rolesList',
        })
    } catch (err) {
        if (err?.isAbort) return
    }
}

// ── Data fetching ──────────────────────────────────────────────────────────

function mapUser(u) {
    return {
        ...u,
        avatarUrl: u.avatar
            ? pb.files.getURL(u, u.avatar, { thumb: '100x100' })
            : null,
        roleName: u.expand?.role?.name ?? null,
    }
}

function buildFilter() {
    const parts = []
    if (search.value.trim()) {
        const s = search.value
            .trim()
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
        parts.push(
            `(username ~ "${s}" || email ~ "${s}" || name ~ "${s}" || firstname ~ "${s}")`,
        )
    }
    if (selectedRole.value) {
        parts.push(`role = "${selectedRole.value}"`)
    }
    // Note: role is a relation ID, filter works directly with the ID
    return parts.join(' && ')
}


async function fetchList(append = false) {
    if (append) {
        loadingMore.value = true
    } else {
        loading.value = true
        page.value = 1
        users.value = []
    }

    try {
        const result = await pb
            .collection('users')
            .getList(page.value, PER_PAGE, {
                sort: '-created',
                filter: buildFilter(),
                expand: 'role',
                requestKey: 'usersList',
            })
        totalItems.value = result.totalItems
        const mapped = result.items.map(mapUser)
        users.value = append ? [...users.value, ...mapped] : mapped
    } catch (err) {
        if (err?.isAbort) return
        console.error('Failed to fetch users:', err)
        showSnackbar(t('notifications.error.generic'), 'error')
    } finally {
        loading.value = false
        loadingMore.value = false
    }
}

async function loadMore() {
    page.value++
    await fetchList(true)
}

function reloadUsers() {
    fetchList()
}

// ── Watchers ───────────────────────────────────────────────────────────────

let searchDebounce = null
watch(search, () => {
    clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => fetchList(), 300)
})

watch(selectedRole, () => fetchList())

// ── Edit ───────────────────────────────────────────────────────────────────

function editUser(user) {
    editingUser.value = user
}

function onUserUpdated() {
    showSnackbar(t('notifications.success.edit'))
    reloadUsers()
}

// ── Delete ─────────────────────────────────────────────────────────────────

function confirmDelete(user) {
    deletingUser.value = user
    deleteDialog.value = true
}

async function deleteUser() {
    deleting.value = true
    try {
        await pb.collection('users').delete(deletingUser.value.id)
        users.value = users.value.filter((u) => u.id !== deletingUser.value.id)
        totalItems.value = Math.max(0, totalItems.value - 1)
        showSnackbar(t('users.deleteSuccess'))
        deleteDialog.value = false
        deletingUser.value = null
    } catch (err) {
        console.error('Error deleting user:', err)
        showSnackbar(t('users.deleteError'), 'error')
    } finally {
        deleting.value = false
    }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function initials(firstname, lastname) {
    const f = firstname?.[0]?.toUpperCase() ?? ''
    const l = lastname?.[0]?.toUpperCase() ?? ''
    return f + l || '?'
}

const AVATAR_COLORS = [
    'primary',
    'secondary',
    'success',
    'info',
    'deep-purple',
    'teal',
    'indigo',
    'pink',
    'cyan',
    'orange',
]

function avatarColor(name) {
    if (!name) return 'primary'
    const code = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function formatDate(date) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

function showSnackbar(message, color = 'success') {
    snackbar.message = message
    snackbar.color = color
    snackbar.show = true
}

// ── Lifecycle ──────────────────────────────────────────────────────────────

let unsubscribe
onMounted(async () => {
    await Promise.all([fetchList(), fetchRoles()])

    unsubscribe = await pb.collection('users').subscribe('*', async (e) => {
        if (e.action === 'delete') {
            users.value = users.value.filter((u) => u.id !== e.record.id)
            totalItems.value = Math.max(0, totalItems.value - 1)
            } else if (e.action === 'create') {
            totalItems.value++
            try {
                const rec = await pb.collection('users').getOne(e.record.id, {
                    expand: 'role',
                    requestKey: null,
                })
                users.value = [mapUser(rec), ...users.value]
            } catch {}
            } else if (e.action === 'update') {
            const idx = users.value.findIndex((u) => u.id === e.record.id)
            if (idx !== -1) {
                try {
                    const rec = await pb
                        .collection('users')
                        .getOne(e.record.id, {
                            expand: 'role',
                            requestKey: null,
                        })
                    users.value[idx] = mapUser(rec)
                } catch {}
            }
            }
    })
})

onBeforeUnmount(() => {
    unsubscribe?.()?.catch?.(() => {})
})
</script>

<style scoped>
.users-page {
    max-width: 100%;
}

.user-card {
    transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
}

.user-card:hover {
    border-color: rgba(var(--v-theme-primary), 0.3);
}
</style>
