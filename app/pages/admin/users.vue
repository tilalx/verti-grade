<template>
    <v-container class="users-page">
        <LayoutPageHeader :title="t('users.title')">
            <template #actions>
                <UserCreateUser @user-created="reloadUsers" />
            </template>
        </LayoutPageHeader>

        <!-- ── Filter bar ────────────────────────────────────────────────── -->
        <FilterBar
            v-model="search"
            :search-label="t('users.searchUsers')"
            :active-filter-count="selectedRole ? 1 : 0"
            @clear="clearFilters"
        >
            <template #filters>
                <v-row density="comfortable">
                    <v-col cols="12" sm="6" md="4">
                        <v-select
                            v-model="selectedRole"
                            :label="t('users.role')"
                            :items="roleOptions"
                            item-title="text"
                            item-value="value"
                            clearable
                            hide-details
                            density="compact"
                            data-testid="users-filter-role"
                        />
                    </v-col>
                </v-row>
            </template>
        </FilterBar>

        <LayoutLoadingState
            v-if="loading && !users.length"
            variant="cards"
            type="list-item-avatar-two-line"
        />

        <!-- ── Empty state ───────────────────────────────────────────────── -->
        <LayoutEmptyState
            v-else-if="!loading && !users.length"
            icon="mdi-account-off-outline"
            :title="t('users.noUsers')"
            :hint="t('users.noUsersHint')"
        />

        <!-- ── User Cards ────────────────────────────────────────────────── -->
        <v-row v-else>
            <v-col v-for="user in users" :key="user.id" cols="12" sm="6" lg="4">
                <v-card
                    border
                    flat
                    class="user-card d-flex flex-column"
                    :data-testid="`user-card-${user.id}`"
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
                                    :alt="user.username"
                                    cover
                                />
                                <span
                                    v-else
                                    class="text-body-small font-weight-bold"
                                >
                                    {{ initials(user.firstname, user.name) }}
                                </span>
                            </v-avatar>
                        </template>

                        <v-card-title
                            class="text-body-medium font-weight-semibold px-0 py-0 card-title-tight"
                        >
                            {{
                                [user.firstname, user.name]
                                    .filter(Boolean)
                                    .join(' ') || user.username
                            }}
                        </v-card-title>
                        <v-card-subtitle
                            class="text-body-small px-0 py-0 card-subtitle-muted"
                        >
                            {{ user.username }}
                        </v-card-subtitle>

                        <template #append>
                            <v-chip
                                v-if="user.roleName"
                                data-testid="user-card-role"
                                size="small"
                                :color="user.roleColor || undefined"
                                :variant="user.roleColor ? 'flat' : 'tonal'"
                                :style="
                                    user.roleColor
                                        ? {
                                              color: readableTextOn(
                                                  user.roleColor,
                                              ),
                                          }
                                        : undefined
                                "
                            >
                                {{ user.roleName }}
                            </v-chip>
                        </template>
                    </v-card-item>

                    <v-card-text class="py-2">
                        <div class="text-body-small text-disabled">
                            {{ user.email }}
                        </div>
                        <div class="text-body-small text-disabled mt-1">
                            {{ t('table.created_at') }}:
                            {{ formatCreatedDate(user.created) }}
                        </div>
                    </v-card-text>

                    <v-card-actions class="pt-0 px-2 pb-2">
                        <v-spacer />
                        <v-btn
                            icon
                            size="small"
                            variant="text"
                            :aria-label="t('actions.edit')"
                            data-testid="user-card-edit"
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
                            :aria-label="t('actions.delete')"
                            data-testid="user-card-delete"
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
            <p
                class="text-body-small text-medium-emphasis mb-3"
                data-testid="users-showing"
            >
                {{ t('users.showing', { n: users.length, total: totalItems }) }}
            </p>
            <v-btn
                v-if="hasMore"
                variant="tonal"
                :loading="loadingMore"
                data-testid="users-load-more"
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
        <ConfirmDialog
            v-model="deleteDialog"
            :title="t('users.delete')"
            :message="t('users.deleteConfirm')"
            :loading="deleting"
            @confirm="deleteUser"
        />

        <!-- ── Role Permissions ──────────────────────────────────────────── -->
        <v-divider class="my-8" />

        <div id="roles" class="scroll-anchor">
            <AdminRolePermissionsEditor />
        </div>
    </v-container>
</template>

<script setup lang="ts">
import { readableTextOn } from '~/utils/color'
import { avatarColor } from '~/utils/avatar'
import { formatDate } from '#shared/utils/formatting'
import type { RoleRecord, UserRecord } from '~/types/models'

type AdminUser = UserRecord & {
    avatarUrl: string | null
    roleName: string | null
    roleColor: string | null
}

const { t, locale } = useI18n()
const pb = usePocketbase()

useHead({
    title: t('page.title.users'),
    meta: [{ name: 'description', content: t('page.content.users') }],
})

definePageMeta({
    middleware: ['auth'],
    requiredPermission: 'manage_users',
})

// ── State ──────────────────────────────────────────────────────────────────

const { pending: deleting, run: runDelete } = useAsyncAction()

const pageRoute = useRoute()
const search = ref(String(pageRoute.query.search ?? ''))
watch(
    () => pageRoute.query.search,
    (value) => (search.value = String(value ?? '')),
)
const selectedRole = ref<string | null>(null)

const editingUser = ref<AdminUser | null>(null)
const deletingUser = ref<AdminUser | null>(null)
const deleteDialog = ref(false)

const { notify } = useNotification()

const currentUserId = computed(() => pb.authStore.record?.id ?? null)

// ── Roles ─────────────────────────────────────────────────────────────────

const { data: roles } = useRoles()

const roleOptions = computed(() => [
    { text: t('filter.all'), value: null },
    ...roles.value.map((r) => ({ text: r.name, value: r.id })),
])

// ── Data fetching ──────────────────────────────────────────────────────────

function mapUser(user: UserRecord): AdminUser {
    const role = user.expand?.role as RoleRecord | undefined
    return {
        ...user,
        avatarUrl:
            usePbFileUrl(user, user.avatar, { thumb: '100x100' }) || null,
        roleName: role?.name ?? null,
        roleColor: role?.color ?? null,
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
    return parts.join(' && ')
}

const {
    items: users,
    totalItems,
    loading,
    loadingMore,
    hasMore,
    refresh: reloadUsers,
    loadMore,
    prefetch,
} = usePbList<UserRecord, AdminUser>('users', {
    perPage: 48,
    requestKey: 'usersList',
    query: () => ({ sort: '-created', filter: buildFilter(), expand: 'role' }),
    map: mapUser,
})

// ── Watchers ───────────────────────────────────────────────────────────────

function clearFilters() {
    selectedRole.value = null
}

let searchDebounce: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
    clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => reloadUsers(), 300)
})

watch(selectedRole, () => reloadUsers())

// ── Edit ───────────────────────────────────────────────────────────────────

function editUser(user: AdminUser) {
    editingUser.value = user
}

function onUserUpdated() {
    notify(t('notifications.success.edit'))
    reloadUsers()
}

// ── Delete ─────────────────────────────────────────────────────────────────

function confirmDelete(user: AdminUser) {
    deletingUser.value = user
    deleteDialog.value = true
}

async function deleteUser() {
    const target = deletingUser.value
    if (!target) return
    await runDelete(
        async () => {
            await pb.collection('users').delete(target.id)
            removeUser(target.id)
            deleteDialog.value = false
            deletingUser.value = null
        },
        {
            success: t('users.deleteSuccess'),
            error: t('users.deleteError'),
        },
    )
}

function removeUser(id: string) {
    const remaining = users.value.filter((u) => u.id !== id)
    if (remaining.length === users.value.length) return
    users.value = remaining
    totalItems.value = Math.max(0, totalItems.value - 1)
}

// ── Helpers ────────────────────────────────────────────────────────────────

function initials(
    firstname: string | null | undefined,
    lastname: string | null | undefined,
) {
    const f = firstname?.[0]?.toUpperCase() ?? ''
    const l = lastname?.[0]?.toUpperCase() ?? ''
    return f + l || '?'
}

function formatCreatedDate(date: string | undefined) {
    return formatDate(date, {
        locale: locale.value,
        fallback: '—',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

// ── Lifecycle ──────────────────────────────────────────────────────────────

const { subscribe } = usePbSubscription()

await prefetch('admin-users')

onMounted(async () => {
    await subscribe('users', async (e) => {
        if (e.action === 'delete') {
            removeUser(e.record.id)
        } else if (e.action === 'create') {
            try {
                const filter = buildFilter()
                const idClause = pb.filter('id = {:id}', { id: e.record.id })
                const { items } = await pb
                    .collection('users')
                    .getList<UserRecord>(1, 1, {
                        filter: filter
                            ? `${idClause} && (${filter})`
                            : idClause,
                        expand: 'role',
                        skipTotal: true,
                        requestKey: null,
                    })
                const rec = items[0]
                if (filter !== buildFilter()) return
                if (!rec || users.value.some((u) => u.id === rec.id)) return
                totalItems.value++
                users.value = [mapUser(rec), ...users.value]
            } catch (err) {
                console.error('Realtime user create refresh failed:', err)
            }
        } else if (e.action === 'update') {
            const idx = users.value.findIndex((u) => u.id === e.record.id)
            if (idx !== -1) {
                try {
                    const rec = await pb
                        .collection('users')
                        .getOne<UserRecord>(e.record.id, {
                            expand: 'role',
                            requestKey: null,
                        })
                    users.value[idx] = mapUser(rec)
                } catch (err) {
                    console.error('Realtime user update refresh failed:', err)
                }
            }
        }
    })
})
</script>

<style scoped>
.user-card {
    transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
}

.user-card:hover {
    border-color: rgba(var(--v-theme-primary), 0.3);
}
</style>
