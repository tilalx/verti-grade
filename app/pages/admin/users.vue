<template>
    <div class="users-page mx-auto w-full p-4">
        <LayoutPageHeader :title="t('users.title')">
            <template #actions>
                <UserCreateUser @user-created="reloadUsers" />
            </template>
        </LayoutPageHeader>

        <FilterBar
            v-model="search"
            :search-label="t('users.searchUsers')"
            :active-filter-count="selectedRole ? 1 : 0"
            @clear="clearFilters"
        >
            <template #filters>
                <div class="contents">
                    <FilterSelect
                        :label="t('users.role')"
                        v-model="selectedRole"
                        :items="roleOptions"
                        value-key="value"
                        :placeholder="t('filter.all')"
                        clear
                        data-testid="users-filter-role"
                        @clear="selectedRole = null"
                    />
                </div>
            </template>
        </FilterBar>

        <LayoutLoadingState
            v-if="loading && !users.length"
            variant="cards"
            type="list-item-avatar-two-line"
        />

        <LayoutEmptyState
            v-else-if="!loading && !users.length"
            icon="i-lucide-user-x"
            :title="t('users.noUsers')"
            :hint="t('users.noUsersHint')"
        />

        <div v-else class="grid grid-cols-12 gap-4">
            <div
                v-for="user in users"
                :key="user.id"
                class="col-span-12 sm:col-span-6 lg:col-span-4"
            >
                <div
                    class="user-card flex h-full flex-col rounded-lg border bg-default"
                    :data-testid="`user-card-${user.id}`"
                >
                    <div class="flex items-center gap-3 px-4 pb-1 pt-3">
                        <img
                            v-if="user.avatarUrl"
                            :src="user.avatarUrl"
                            :alt="user.username"
                            class="size-[42px] shrink-0 rounded-full object-cover"
                        />
                        <span
                            v-else
                            class="inline-flex size-[42px] shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            :style="{
                                backgroundColor: avatarColor(user.username),
                            }"
                        >
                            {{ initials(user.firstname, user.name) }}
                        </span>

                        <div class="min-w-0 flex-1">
                            <div
                                class="text-sm font-semibold card-title-tight truncate"
                            >
                                {{
                                    [user.firstname, user.name]
                                        .filter(Boolean)
                                        .join(' ') || user.username
                                }}
                            </div>
                            <div
                                class="text-xs card-subtitle-muted text-muted truncate"
                            >
                                {{ user.username }}
                            </div>
                        </div>

                        <UBadge
                            v-if="user.roleName"
                            data-testid="user-card-role"
                            :color="user.roleColor ? 'neutral' : 'primary'"
                            :variant="user.roleColor ? 'solid' : 'soft'"
                            :style="
                                user.roleColor
                                    ? {
                                          backgroundColor: user.roleColor,
                                          color: readableTextOn(user.roleColor),
                                      }
                                    : undefined
                            "
                        >
                            {{ user.roleName }}
                        </UBadge>
                    </div>

                    <div class="px-4 py-2">
                        <div class="text-xs text-dimmed">
                            {{ user.email }}
                        </div>
                        <div class="text-xs text-dimmed mt-1">
                            {{ t('table.created_at') }}:
                            {{ formatCreatedDate(user.created) }}
                        </div>
                    </div>

                    <div class="mt-auto flex justify-end gap-1 px-2 pb-2">
                        <UTooltip :text="t('actions.edit')">
                            <UButton
                                icon="i-lucide-pencil"
                                color="neutral"
                                variant="ghost"
                                :aria-label="t('actions.edit')"
                                data-testid="user-card-edit"
                                @click="editUser(user)"
                            />
                        </UTooltip>
                        <UTooltip :text="t('actions.delete')">
                            <UButton
                                icon="i-lucide-trash-2"
                                color="error"
                                variant="ghost"
                                :disabled="user.id === currentUserId"
                                :aria-label="t('actions.delete')"
                                data-testid="user-card-delete"
                                @click="confirmDelete(user)"
                            />
                        </UTooltip>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="!loading && users.length" class="text-center mt-4">
            <p class="text-xs text-muted mb-3" data-testid="users-showing">
                {{ t('users.showing', { n: users.length, total: totalItems }) }}
            </p>
            <UButton
                v-if="hasMore"
                color="neutral"
                variant="soft"
                :loading="loadingMore"
                data-testid="users-load-more"
                @click="loadMore"
            >
                {{ t('actions.load_more') }}
            </UButton>
        </div>

        <UserEditUser
            :user="editingUser"
            @user-updated="onUserUpdated"
            @close="editingUser = null"
        />

        <ConfirmDialog
            v-model="deleteDialog"
            :title="t('users.delete')"
            :message="t('users.deleteConfirm')"
            :loading="deleting"
            @confirm="deleteUser"
        />

        <USeparator class="my-8" />

        <div id="roles" class="scroll-anchor">
            <AdminRolePermissionsEditor />
        </div>
    </div>
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

const roleOptions = computed(() =>
    roles.value.map((r) => ({ label: r.name, value: r.id })),
)

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
    border-color: color-mix(in oklab, var(--ui-primary) 30%, transparent);
}
</style>
