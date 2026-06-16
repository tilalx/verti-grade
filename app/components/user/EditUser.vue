<template>
    <v-dialog v-model="dialog" max-width="520" :persistent="hasChanges">
        <v-card rounded="xl" elevation="8">
            <!-- Header with avatar -->
            <div class="dialog-header pa-6 pb-4">
                <div class="d-flex align-center ga-3">
                    <div class="avatar-wrapper" @click="avatarInput?.click()">
                        <v-avatar size="64" class="avatar-ring">
                            <v-img
                                v-if="avatarPreview"
                                :src="avatarPreview"
                                cover
                            />
                            <v-icon
                                v-else
                                icon="mdi-account"
                                size="32"
                                color="grey-lighten-1"
                            />
                        </v-avatar>
                        <div class="avatar-overlay">
                            <v-icon icon="mdi-camera" size="18" color="white" />
                        </div>
                        <v-tooltip activator="parent" location="bottom">
                            {{ $t('account.changeAvatar') }}
                        </v-tooltip>
                    </div>
                    <input
                        type="file"
                        ref="avatarInput"
                        accept="image/jpeg,image/png,image/svg+xml,image/webp"
                        style="display: none"
                        @change="onAvatarPicked"
                    />

                    <div class="flex-grow-1 overflow-hidden">
                        <div class="text-h6 font-weight-bold text-truncate">
                            {{ $t('users.edit') }}
                        </div>
                        <div
                            class="text-body-2 text-medium-emphasis text-truncate"
                        >
                            {{ editableUser.email }}
                        </div>
                    </div>
                </div>
            </div>

            <v-divider />

            <v-card-text class="pa-6">
                <v-form ref="form" v-model="valid">
                    <!-- Name fields -->
                    <v-row density="comfortable">
                        <v-col cols="12" sm="6">
                            <v-text-field
                                v-model="editableUser.firstname"
                                :rules="nameRules"
                                :label="$t('account.firstname')"
                                :placeholder="
                                    $t('account.placeholders.firstname')
                                "
                                prepend-inner-icon="mdi-account-outline"
                                variant="outlined"
                                density="comfortable"
                                rounded="lg"
                            />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field
                                v-model="editableUser.name"
                                :rules="nameRules"
                                :label="$t('account.lastname')"
                                :placeholder="
                                    $t('account.placeholders.lastname')
                                "
                                prepend-inner-icon="mdi-account-outline"
                                variant="outlined"
                                density="comfortable"
                                rounded="lg"
                            />
                        </v-col>
                    </v-row>

                    <!-- Email (read-only) -->
                    <v-text-field
                        :model-value="editableUser.email"
                        :label="$t('account.email')"
                        prepend-inner-icon="mdi-email-outline"
                        variant="outlined"
                        density="comfortable"
                        rounded="lg"
                        disabled
                        class="mb-1"
                    >
                        <template #append-inner>
                            <v-tooltip
                                :text="$t('account.emailLocked')"
                                location="top"
                            >
                                <template #activator="{ props: tp }">
                                    <v-icon
                                        v-bind="tp"
                                        icon="mdi-lock-outline"
                                        size="18"
                                    />
                                </template>
                            </v-tooltip>
                        </template>
                    </v-text-field>

                    <!-- Role -->
                    <v-select
                        v-model="editableUser.role"
                        :items="roles"
                        item-title="name"
                        item-value="id"
                        :label="$t('users.role')"
                        prepend-inner-icon="mdi-shield-account-outline"
                        variant="outlined"
                        density="comfortable"
                        rounded="lg"
                        clearable
                    />
                </v-form>
            </v-card-text>

            <v-divider />

            <!-- Actions -->
            <v-card-actions class="pa-4">
                <v-btn variant="text" @click="close">
                    {{ $t('actions.cancel') }}
                </v-btn>
                <v-spacer />
                <v-chip
                    v-if="hasChanges"
                    size="small"
                    color="warning"
                    variant="tonal"
                    prepend-icon="mdi-pencil-outline"
                    class="mr-2"
                >
                    {{ $t('account.unsavedChanges') }}
                </v-chip>
                <v-btn
                    :disabled="!valid || !hasChanges"
                    :loading="saving"
                    color="primary"
                    variant="flat"
                    rounded="lg"
                    prepend-icon="mdi-content-save-outline"
                    @click="save"
                >
                    {{ $t('actions.save') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { required } from '~/utils/validation'

const { t } = useI18n()
const pb = usePocketbase()
const emit = defineEmits(['user-updated', 'close'])
const props = defineProps({
    user: {
        type: Object,
        default: null,
    },
})

const dialog = ref(false)
const valid = ref(false)
const saving = ref(false)
const form = ref(null)
const roles = ref([])

const editableUser = reactive({
    id: '',
    firstname: '',
    name: '',
    email: '',
    role: null,
    avatar: null,
})
const originalUser = reactive({ ...editableUser })

// ── Avatar ────────────────────────────────────────────────────────────────
const avatarFile = ref(null)
const avatarPreview = ref(null)
const avatarInput = ref(null)

function onAvatarPicked(e) {
    const file = e.target.files?.[0]
    if (file) {
        avatarFile.value = file
        avatarPreview.value = URL.createObjectURL(file)
    }
    e.target.value = ''
}

function initAvatarPreview(user) {
    if (user?.avatar) {
        avatarPreview.value = pb.files.getURL(user, user.avatar, {
            thumb: '100x100',
        })
    } else if (user?.avatarUrl) {
        avatarPreview.value = user.avatarUrl
    } else {
        avatarPreview.value = null
    }
}

// ── Roles ─────────────────────────────────────────────────────────────────
async function fetchRoles() {
    try {
        roles.value = await pb.collection('roles').getFullList({
            sort: 'name',
            requestKey: 'editUserRoles',
        })
    } catch (err) {
        console.error('Failed to fetch roles:', err)
    }
}

onMounted(fetchRoles)

// ── Validation ────────────────────────────────────────────────────────────
const nameRules = [required(t)]

const hasChanges = computed(() => {
    if (avatarFile.value) return true
    return (
        editableUser.firstname !== originalUser.firstname ||
        editableUser.name !== originalUser.name ||
        editableUser.role !== originalUser.role
    )
})

// ── Watch user prop ───────────────────────────────────────────────────────
watch(
    () => props.user,
    (newUser) => {
        if (newUser) {
            Object.assign(editableUser, {
                id: newUser.id,
                firstname: newUser.firstname || '',
                name: newUser.name || '',
                email: newUser.email,
                role: newUser.role || null,
                avatar: newUser.avatar || null,
            })
            Object.assign(originalUser, { ...editableUser })
            avatarFile.value = null
            initAvatarPreview(newUser)
            dialog.value = true
        } else {
            dialog.value = false
        }
    },
)

function close() {
    dialog.value = false
    emit('close')
}

// ── Save ──────────────────────────────────────────────────────────────────
async function save() {
    const { valid: formValid } = await form.value.validate()
    if (!formValid) return

    saving.value = true
    try {
        const formData = new FormData()
        formData.append('firstname', editableUser.firstname)
        formData.append('name', editableUser.name)
        formData.append('role', editableUser.role || '')

        if (avatarFile.value) {
            formData.append('avatar', avatarFile.value)
        }

        await pb.collection('users').update(editableUser.id, formData)
        emit('user-updated')
        close()
    } catch (error) {
        console.error('Failed to update user:', error)
    } finally {
        saving.value = false
    }
}
</script>

<style scoped>
.dialog-header {
    background: linear-gradient(
        135deg,
        rgba(var(--v-theme-surface-variant), 0.5) 0%,
        rgba(var(--v-theme-surface), 1) 100%
    );
}

.avatar-wrapper {
    position: relative;
    cursor: pointer;
    border-radius: 50%;
    flex-shrink: 0;
}

.avatar-ring {
    border: 2.5px solid rgba(var(--v-theme-primary), 0.3);
    transition: border-color 0.2s;
}

.avatar-wrapper:hover .avatar-ring {
    border-color: rgba(var(--v-theme-primary), 0.8);
}

.avatar-overlay {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
}

.avatar-wrapper:hover .avatar-overlay {
    opacity: 1;
}
</style>
