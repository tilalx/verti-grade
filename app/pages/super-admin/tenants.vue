<template>
    <v-container fluid class="pa-6">
        <div class="d-flex align-center justify-space-between mb-6">
            <div>
                <h1 class="text-h5 font-weight-bold">Tenant Management</h1>
                <p class="text-caption text-medium-emphasis mt-1">
                    Super-admin only — manage all gyms / organizations
                </p>
            </div>
            <v-btn
                color="primary"
                variant="tonal"
                rounded="lg"
                prepend-icon="mdi-plus"
                @click="openCreate"
            >
                New Tenant
            </v-btn>
        </div>

        <!-- Tenant list -->
        <v-row>
            <v-col
                v-for="tenant in tenants"
                :key="tenant.id"
                cols="12"
                md="6"
                lg="4"
            >
                <v-card rounded="xl" border flat>
                    <v-card-item>
                        <v-card-title class="text-body-1 font-weight-semibold">
                            {{ tenant.name }}
                        </v-card-title>
                        <v-card-subtitle class="text-caption">
                            slug: <code>{{ tenant.slug }}</code>
                        </v-card-subtitle>
                        <template #append>
                            <v-chip
                                :color="tenant.active ? 'success' : 'error'"
                                size="x-small"
                                variant="tonal"
                            >
                                {{ tenant.active ? 'Active' : 'Inactive' }}
                            </v-chip>
                        </template>
                    </v-card-item>

                    <v-card-text class="pt-0">
                        <div class="text-caption text-medium-emphasis">
                            <strong>Custom domains:</strong>
                            <span v-if="tenant.domains?.length">
                                {{ tenant.domains.join(', ') }}
                            </span>
                            <span v-else class="text-disabled">none</span>
                        </div>
                    </v-card-text>

                    <v-card-actions class="pt-0">
                        <v-btn
                            size="small"
                            variant="text"
                            prepend-icon="mdi-pencil-outline"
                            @click="openEdit(tenant)"
                        >
                            Edit
                        </v-btn>
                        <v-btn
                            size="small"
                            variant="text"
                            prepend-icon="mdi-account-group-outline"
                            @click="openMembers(tenant)"
                        >
                            Members
                        </v-btn>
                        <v-spacer />
                        <v-btn
                            size="small"
                            variant="text"
                            color="error"
                            icon
                            @click="confirmDelete(tenant)"
                        >
                            <v-icon size="18">mdi-delete-outline</v-icon>
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>

        <!-- Create / Edit dialog -->
        <v-dialog v-model="formDialog" max-width="520" scrollable>
            <v-card>
                <v-card-title class="pa-4 pb-3">
                    {{ editingTenant ? 'Edit Tenant' : 'New Tenant' }}
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-4">
                    <v-text-field
                        v-model="form.name"
                        label="Name"
                        density="compact"
                        variant="outlined"
                        rounded="md"
                        class="mb-3"
                    />
                    <v-text-field
                        v-model="form.slug"
                        label="Slug (subdomain)"
                        density="compact"
                        variant="outlined"
                        rounded="md"
                        hint="Used for subdomain detection: slug.yourdomain.com"
                        persistent-hint
                        class="mb-3"
                    />
                    <v-textarea
                        v-model="form.domainsRaw"
                        label="Custom domains (one per line)"
                        density="compact"
                        variant="outlined"
                        rounded="md"
                        rows="3"
                        hint="e.g. gym1.example.com"
                        persistent-hint
                        class="mb-3"
                    />
                    <v-switch
                        v-model="form.active"
                        label="Active"
                        color="primary"
                        density="compact"
                        hide-details
                    />
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-spacer />
                    <v-btn variant="text" @click="formDialog = false">Cancel</v-btn>
                    <v-btn
                        color="primary"
                        variant="tonal"
                        rounded="md"
                        :loading="saving"
                        @click="saveTenant"
                    >
                        Save
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Members dialog -->
        <v-dialog v-model="membersDialog" max-width="600" scrollable>
            <v-card>
                <v-card-title class="pa-4 pb-3">
                    Members — {{ membersTenant?.name }}
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-4">
                    <!-- Add user form -->
                    <div class="d-flex ga-2 mb-4">
                        <v-autocomplete
                            v-model="newMemberUserId"
                            :items="allUsers"
                            item-title="username"
                            item-value="id"
                            label="Add user"
                            density="compact"
                            variant="outlined"
                            rounded="md"
                            hide-details
                            clearable
                        />
                        <v-btn
                            color="primary"
                            variant="tonal"
                            rounded="md"
                            :loading="addingMember"
                            :disabled="!newMemberUserId"
                            @click="addMember"
                        >
                            Add
                        </v-btn>
                    </div>

                    <!-- Member list -->
                    <v-list density="compact" lines="one">
                        <v-list-item
                            v-for="tu in members"
                            :key="tu.id"
                            :title="tu.expand?.user_id?.username ?? tu.user_id"
                            :subtitle="tu.expand?.user_id?.email"
                        >
                            <template #append>
                                <v-btn
                                    icon
                                    size="x-small"
                                    variant="text"
                                    color="error"
                                    @click="removeMember(tu)"
                                >
                                    <v-icon size="16">mdi-close</v-icon>
                                </v-btn>
                            </template>
                        </v-list-item>
                        <v-list-item
                            v-if="!members.length"
                            title="No members yet"
                            class="text-medium-emphasis"
                        />
                    </v-list>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- Delete confirmation -->
        <ConfirmDialog
            v-model="deleteDialog"
            title="Delete Tenant"
            :message="`Permanently delete '${deletingTenant?.name}'? All tenant data (routes, ratings, settings) will be deleted.`"
            confirm-color="error"
            confirm-text="Delete"
            :loading="deleting"
            @confirm="deleteTenant"
        />
    </v-container>
</template>

<script setup>
const pb = usePocketbase()
const { notify } = useNotification()

definePageMeta({
    middleware: ['auth'],
})

useHead({ title: 'Tenant Management' })

// ── State ─────────────────────────────────────────────────────────────────

const tenants = ref([])
const loading = ref(false)

const formDialog = ref(false)
const editingTenant = ref(null)
const saving = ref(false)
const form = reactive({
    name: '',
    slug: '',
    domainsRaw: '',
    active: true,
})

const deleteDialog = ref(false)
const deletingTenant = ref(null)
const deleting = ref(false)

const membersDialog = ref(false)
const membersTenant = ref(null)
const members = ref([])
const allUsers = ref([])
const newMemberUserId = ref(null)
const addingMember = ref(false)

// ── Data ──────────────────────────────────────────────────────────────────

async function fetchTenants() {
    loading.value = true
    try {
        tenants.value = await pb
            .collection('tenants')
            .getFullList({ sort: 'name' })
    } catch (err) {
        console.error(err)
    } finally {
        loading.value = false
    }
}

// ── Create / Edit ─────────────────────────────────────────────────────────

function openCreate() {
    editingTenant.value = null
    Object.assign(form, { name: '', slug: '', domainsRaw: '', active: true })
    formDialog.value = true
}

function openEdit(tenant) {
    editingTenant.value = tenant
    Object.assign(form, {
        name: tenant.name,
        slug: tenant.slug,
        domainsRaw: (tenant.domains ?? []).join('\n'),
        active: tenant.active ?? true,
    })
    formDialog.value = true
}

async function saveTenant() {
    saving.value = true
    try {
        const payload = {
            name: form.name,
            slug: form.slug,
            domains: form.domainsRaw
                .split('\n')
                .map((d) => d.trim())
                .filter(Boolean),
            active: form.active,
        }
        if (editingTenant.value) {
            await pb.collection('tenants').update(editingTenant.value.id, payload)
        } else {
            await pb.collection('tenants').create(payload)
        }
        formDialog.value = false
        await fetchTenants()
        notify('Tenant saved.')
    } catch (err) {
        console.error(err)
        notify('Failed to save tenant.', 'error')
    } finally {
        saving.value = false
    }
}

// ── Delete ────────────────────────────────────────────────────────────────

function confirmDelete(tenant) {
    deletingTenant.value = tenant
    deleteDialog.value = true
}

async function deleteTenant() {
    if (!deletingTenant.value) return
    deleting.value = true
    try {
        await pb.collection('tenants').delete(deletingTenant.value.id)
        deleteDialog.value = false
        await fetchTenants()
        notify('Tenant deleted.')
    } catch (err) {
        console.error(err)
        notify('Failed to delete tenant.', 'error')
    } finally {
        deleting.value = false
    }
}

// ── Members ───────────────────────────────────────────────────────────────

async function openMembers(tenant) {
    membersTenant.value = tenant
    membersDialog.value = true
    await Promise.all([fetchMembers(tenant.id), fetchAllUsers()])
}

async function fetchMembers(tenantId) {
    try {
        members.value = await pb
            .collection('tenant_users')
            .getFullList({
                filter: `tenant_id = "${tenantId}"`,
                expand: 'user_id',
                sort: 'user_id.username',
            })
    } catch (err) {
        members.value = []
    }
}

async function fetchAllUsers() {
    try {
        allUsers.value = await pb
            .collection('users')
            .getFullList({ sort: 'username', fields: 'id,username,email' })
    } catch {
        allUsers.value = []
    }
}

async function addMember() {
    if (!newMemberUserId.value || !membersTenant.value) return
    addingMember.value = true
    try {
        await pb.collection('tenant_users').create({
            tenant_id: membersTenant.value.id,
            user_id: newMemberUserId.value,
        })
        newMemberUserId.value = null
        await fetchMembers(membersTenant.value.id)
        notify('User added to tenant.')
    } catch (err) {
        console.error(err)
        notify('Failed to add user.', 'error')
    } finally {
        addingMember.value = false
    }
}

async function removeMember(tu) {
    try {
        await pb.collection('tenant_users').delete(tu.id)
        await fetchMembers(membersTenant.value.id)
        notify('User removed from tenant.')
    } catch (err) {
        console.error(err)
        notify('Failed to remove user.', 'error')
    }
}

// ── Init ──────────────────────────────────────────────────────────────────

onMounted(fetchTenants)
</script>
