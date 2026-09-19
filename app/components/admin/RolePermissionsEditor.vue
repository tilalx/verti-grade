<template>
    <v-card rounded="xl" border flat>
        <v-card-item>
            <v-card-title class="text-h6 font-weight-bold">
                {{ t('permissions.title') }}
            </v-card-title>
        </v-card-item>

        <v-card-text v-if="loading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" />
        </v-card-text>

        <v-table v-else data-testid="role-permissions-table">
            <thead>
                <tr>
                    <th class="text-left">
                        {{ t('permissions.role') }}
                    </th>
                    <th
                        v-for="perm in allPermissions"
                        :key="perm.id"
                        class="text-center"
                    >
                        {{ t('permissions.features.' + perm.name) }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="role in roles"
                    :key="role.id"
                    :data-testid="`role-permissions-row-${role.name}`"
                >
                    <td>
                        <v-chip
                            size="small"
                            :color="
                                role.name === 'admin' ? 'primary' : 'default'
                            "
                            variant="tonal"
                        >
                            {{ role.name }}
                        </v-chip>
                    </td>
                    <td
                        v-for="perm in allPermissions"
                        :key="perm.id"
                        class="text-center"
                    >
                        <v-checkbox-btn
                            :model-value="hasPermission(role, perm.id)"
                            :disabled="role.name === 'admin' || saving"
                            density="compact"
                            class="d-inline-flex"
                            :data-testid="`role-permissions-${role.name}-${perm.name}`"
                            @update:model-value="togglePermission(role, perm)"
                        />
                    </td>
                </tr>
            </tbody>
        </v-table>
    </v-card>
</template>

<script setup>
const { t } = useI18n()
const pb = usePocketbase()

const loading = ref(true)
const saving = ref(false)
const roles = ref([])
const allPermissions = ref([])
const { notify } = useNotification()

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

    // Apply optimistically so the checkbox (bound to role.permissions via
    // hasPermission) always reflects the click immediately, then roll back
    // on failure — otherwise a rejected update leaves the prop unchanged
    // and Vuetify's checkbox never resyncs to the (correct) prior state.
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
        notify(t('permissions.updateError'), 'error')
    } finally {
        saving.value = false
    }
}

async function fetchData() {
    loading.value = true
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
        notify(t('permissions.loadError'), 'error')
    } finally {
        loading.value = false
    }
}

onMounted(fetchData)
</script>
