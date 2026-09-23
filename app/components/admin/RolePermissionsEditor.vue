<template>
    <section class="role-section">
        <LayoutSectionHeader
            :title="t('permissions.title')"
            :subtitle="t('permissions.subtitle')"
        >
            <template #actions>
                <v-btn
                    color="primary"
                    variant="tonal"
                    size="small"
                    prepend-icon="mdi-shield-plus-outline"
                    data-testid="role-create-open"
                    @click="startCreate"
                >
                    {{ t('permissions.addRole') }}
                </v-btn>
            </template>
        </LayoutSectionHeader>

        <v-row v-if="loading">
            <v-col v-for="i in 3" :key="i" cols="12" md="6" lg="4">
                <v-skeleton-loader type="card" rounded="lg" />
            </v-col>
        </v-row>

        <LayoutEmptyState
            v-else-if="!roles.length"
            icon="mdi-shield-off-outline"
            :title="t('permissions.noRoles')"
        />

        <v-row v-else data-testid="role-permissions-table">
            <v-col v-for="role in roles" :key="role.id" cols="12" md="6" lg="4">
                <v-card
                    border
                    flat
                    height="100%"
                    class="role-card d-flex flex-column"
                    :data-testid="`role-permissions-row-${role.name}`"
                >
                    <v-card-item class="pb-1 pt-3">
                        <template #prepend>
                            <v-avatar
                                size="42"
                                :color="role.color || 'surface-variant'"
                                :data-testid="`role-color-${role.name}`"
                            >
                                <v-icon
                                    size="20"
                                    :color="readableTextOn(role.color)"
                                >
                                    mdi-shield-account-outline
                                </v-icon>
                            </v-avatar>
                        </template>

                        <v-card-title
                            class="text-body-medium font-weight-semibold px-0 py-0"
                            style="line-height: 1.3"
                        >
                            {{ role.name }}
                        </v-card-title>
                        <v-card-subtitle
                            class="text-body-small px-0 py-0"
                            style="opacity: 0.7; white-space: normal"
                        >
                            {{
                                role.description ||
                                t('permissions.noDescription')
                            }}
                        </v-card-subtitle>

                        <template #append>
                            <v-chip
                                size="small"
                                variant="tonal"
                                :data-testid="`role-granted-${role.name}`"
                            >
                                {{ grantedCount(role) }}/{{
                                    allPermissions.length
                                }}
                            </v-chip>
                        </template>
                    </v-card-item>

                    <v-divider class="mt-3" />

                    <v-card-text class="py-2 flex-grow-1">
                        <v-row density="compact">
                            <v-col
                                v-for="perm in allPermissions"
                                :key="perm.id"
                                cols="12"
                                sm="6"
                            >
                                <v-checkbox
                                    :model-value="hasPermission(role, perm.id)"
                                    :label="
                                        t('permissions.features.' + perm.name)
                                    "
                                    :disabled="isProtectedRole(role) || saving"
                                    density="compact"
                                    hide-details
                                    color="primary"
                                    :data-testid="`role-permissions-${role.name}-${perm.name}`"
                                    @update:model-value="
                                        togglePermission(role, perm)
                                    "
                                />
                            </v-col>
                        </v-row>
                    </v-card-text>

                    <v-card-actions class="pt-0 px-2 pb-2">
                        <v-spacer />
                        <v-btn
                            icon
                            size="small"
                            variant="text"
                            :aria-label="t('permissions.editRole')"
                            :data-testid="`role-edit-${role.name}`"
                            @click="startEdit(role)"
                        >
                            <v-icon size="18">mdi-pencil-outline</v-icon>
                            <v-tooltip activator="parent" location="top">{{
                                t('permissions.editRole')
                            }}</v-tooltip>
                        </v-btn>
                        <v-btn
                            v-if="!isProtectedRole(role)"
                            icon
                            size="small"
                            variant="text"
                            :aria-label="t('permissions.deleteRole')"
                            :data-testid="`role-delete-${role.name}`"
                            @click="confirmDelete(role)"
                        >
                            <v-icon size="18" color="error"
                                >mdi-delete-outline</v-icon
                            >
                            <v-tooltip activator="parent" location="top">{{
                                t('permissions.deleteRole')
                            }}</v-tooltip>
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>

        <AdminRoleFormDialog
            :role="editingRole"
            @saved="onRoleSaved"
            @close="editingRole = null"
        />

        <LayoutDialogShell
            v-model="deleteDialog"
            :title="t('permissions.deleteRole')"
            sheet-on-mobile
            data-testid="role-delete-dialog"
        >
            <p class="text-body-medium mb-4">
                {{
                    deletingRole
                        ? t('permissions.deleteRoleConfirm', {
                              name: deletingRole.name,
                          })
                        : ''
                }}
            </p>

            <template v-if="holderCount > 0">
                <v-alert
                    type="warning"
                    variant="tonal"
                    density="compact"
                    class="mb-4"
                    data-testid="role-delete-holders"
                >
                    {{
                        t('permissions.deleteRoleReassign', { n: holderCount })
                    }}
                </v-alert>

                <v-select
                    v-model="reassignTo"
                    :items="reassignOptions"
                    item-title="name"
                    item-value="id"
                    :label="t('permissions.reassignTo')"
                    prepend-inner-icon="mdi-account-switch-outline"
                    hide-details
                    data-testid="role-delete-reassign"
                />
            </template>

            <template #actions>
                <v-btn
                    variant="text"
                    data-testid="role-delete-cancel"
                    @click="deleteDialog = false"
                >
                    {{ t('actions.cancel') }}
                </v-btn>
                <v-spacer />
                <v-btn
                    color="error"
                    variant="flat"
                    :loading="deleting || countingHolders"
                    :disabled="
                        countingHolders || (holderCount > 0 && !reassignTo)
                    "
                    prepend-icon="mdi-delete-outline"
                    data-testid="role-delete-confirm"
                    @click="deleteRole"
                >
                    {{ t('actions.delete') }}
                </v-btn>
            </template>
        </LayoutDialogShell>
    </section>
</template>

<script setup>
import {
    isProtectedRole,
    reassignTargets,
    defaultReassignTarget,
    readableTextOn,
} from '~/utils/roles'

const { t } = useI18n()
const pb = usePocketbase()

const REASSIGN_BATCH_SIZE = 200

const loading = ref(true)
const saving = ref(false)
const roles = ref([])
const allPermissions = ref([])
const { notify, error: notifyError } = useNotification()

const editingRole = ref(null)

const deleteDialog = ref(false)
const deletingRole = ref(null)
const holderCount = ref(0)
const countingHolders = ref(false)
const reassignTo = ref(null)
const deleting = ref(false)

const reassignOptions = computed(() =>
    deletingRole.value
        ? reassignTargets(roles.value, deletingRole.value.id)
        : [],
)

function grantedCount(role) {
    return (role.permissions ?? []).length
}

function hasPermission(role, permId) {
    const perms = role.permissions ?? []
    return perms.includes(permId)
}

async function togglePermission(role, perm) {
    const previousPerms = role.permissions ?? []
    const currentPerms = [...previousPerms]
    const idx = currentPerms.indexOf(perm.id)
    if (idx === -1) {
        currentPerms.push(perm.id)
    } else {
        currentPerms.splice(idx, 1)
    }

    role.permissions = currentPerms
    saving.value = true
    try {
        await pb.collection('roles').update(role.id, {
            permissions: currentPerms,
        })
        notify(t('permissions.updated'), 'success')
    } catch (err) {
        console.error('Failed to update role permissions:', err)
        role.permissions = previousPerms
        notifyError(t('permissions.updateError'))
    } finally {
        saving.value = false
    }
}

// ── Create / edit ──────────────────────────────────────────────────────────

function startCreate() {
    editingRole.value = { name: '', description: '', color: '' }
}

function startEdit(role) {
    editingRole.value = { ...role }
}

async function onRoleSaved(kind) {
    editingRole.value = null
    notify(
        t(
            kind === 'created'
                ? 'permissions.roleCreated'
                : 'permissions.roleUpdated',
        ),
        'success',
    )
    await refreshRoles()
}

async function refreshRoles() {
    await Promise.all([fetchData({ silent: true }), refreshNuxtData('roles')])
}

// ── Delete ─────────────────────────────────────────────────────────────────

async function confirmDelete(role) {
    deletingRole.value = role
    holderCount.value = 0
    countingHolders.value = true
    reassignTo.value = defaultReassignTarget(roles.value, role.id)
    deleteDialog.value = true

    try {
        const held = await pb.collection('users').getList(1, 1, {
            filter: pb.filter('role = {:id}', { id: role.id }),
            fields: 'id',
            requestKey: 'roleHolderCount',
        })
        holderCount.value = held.totalItems
    } catch (err) {
        if (err?.isAbort) return
        console.error('Failed to count role holders:', err)
        notifyError(t('permissions.loadError'))
        deleteDialog.value = false
    } finally {
        countingHolders.value = false
    }
}

async function deleteRole() {
    const role = deletingRole.value
    if (!role) return

    deleting.value = true
    try {
        if (holderCount.value > 0) {
            const holders = await pb.collection('users').getFullList({
                filter: pb.filter('role = {:id}', { id: role.id }),
                fields: 'id',
                requestKey: 'roleHolders',
            })
            for (let i = 0; i < holders.length; i += REASSIGN_BATCH_SIZE) {
                const batch = pb.createBatch()
                for (const u of holders.slice(i, i + REASSIGN_BATCH_SIZE)) {
                    batch.collection('users').update(u.id, {
                        role: reassignTo.value,
                    })
                }
                await batch.send()
            }
        }

        await pb.collection('roles').delete(role.id)
        deleteDialog.value = false
        deletingRole.value = null
        notify(t('permissions.roleDeleted'), 'success')
        await refreshRoles()
    } catch (err) {
        console.error('Failed to delete role:', err)
        notifyError(t('permissions.roleDeleteError'))
    } finally {
        deleting.value = false
    }
}

// ── Data ───────────────────────────────────────────────────────────────────

async function fetchData({ silent = false } = {}) {
    if (!silent) loading.value = true
    try {
        const [rolesData, permsData] = await Promise.all([
            pb.collection('roles').getFullList({
                sort: 'name',
                requestKey: 'rolePermEditor_roles',
            }),
            pb.collection('permissions').getFullList({
                sort: 'name',
                requestKey: 'rolePermEditor_perms',
            }),
        ])
        roles.value = rolesData
        allPermissions.value = permsData
    } catch (err) {
        if (err?.isAbort) return
        console.error('Failed to fetch roles/permissions:', err)
        notifyError(t('permissions.loadError'))
    } finally {
        loading.value = false
    }
}

const { data: initial } = useAsyncData('role-permissions', async () => {
    await fetchData()
    return { roles: roles.value, permissions: allPermissions.value }
})

if (initial.value) {
    roles.value = initial.value.roles
    allPermissions.value = initial.value.permissions
    loading.value = false
}
</script>
