<template>
    <LayoutDialogShell
        v-model="dialog"
        :persistent="hasChanges"
        data-testid="user-edit-dialog"
    >
        <template #title>
            <div class="avatar-wrapper" @click="avatarInput?.click()">
                <v-avatar size="64" class="avatar-ring">
                    <v-img
                        v-if="avatarPreview"
                        :src="avatarPreview"
                        :alt="$t('account.changeAvatar')"
                        cover
                    />
                    <v-icon
                        v-else
                        icon="mdi-account-outline"
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
                <div class="text-title-large font-weight-bold text-truncate">
                    {{ $t('users.edit') }}
                </div>
                <div
                    class="text-body-medium text-medium-emphasis text-truncate"
                >
                    {{ editableUser.email }}
                </div>
            </div>
        </template>

        <v-form ref="form" v-model="valid">
            <!-- Name fields -->
            <v-row density="comfortable">
                <v-col cols="12" sm="6">
                    <v-text-field
                        v-model="editableUser.firstname"
                        :rules="nameRules"
                        :label="$t('account.firstname')"
                        :placeholder="$t('account.placeholders.firstname')"
                        prepend-inner-icon="mdi-account-outline"
                        data-testid="user-edit-firstname"
                    />
                </v-col>
                <v-col cols="12" sm="6">
                    <v-text-field
                        v-model="editableUser.name"
                        :rules="nameRules"
                        :label="$t('account.lastname')"
                        :placeholder="$t('account.placeholders.lastname')"
                        prepend-inner-icon="mdi-account-outline"
                        data-testid="user-edit-lastname"
                    />
                </v-col>
            </v-row>

            <!-- Email (read-only) -->
            <v-text-field
                :model-value="editableUser.email"
                :label="$t('account.email')"
                prepend-inner-icon="mdi-email-outline"
                disabled
                class="mb-1"
            >
                <template #append-inner>
                    <v-tooltip :text="$t('account.emailLocked')" location="top">
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
                clearable
                data-testid="user-edit-role"
            />
        </v-form>
        <template #actions>
            <v-btn variant="text" data-testid="user-edit-cancel" @click="close">
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
                prepend-icon="mdi-content-save-outline"
                data-testid="user-edit-submit"
                @click="save"
            >
                {{ $t('actions.save') }}
            </v-btn>
        </template>
    </LayoutDialogShell>
</template>

<script setup lang="ts">
import type { VForm } from 'vuetify/components'
import { required, maxLength } from '~/utils/validation'
import type { UserRecord } from '~/types/models'

type EditableUserSource = UserRecord & { avatarUrl?: string | null }

const { t } = useI18n()
const pb = usePocketbase()
const emit = defineEmits<{ 'user-updated': []; close: [] }>()
const props = withDefaults(
    defineProps<{ user?: EditableUserSource | null }>(),
    { user: null },
)

const dialog = ref(false)
const valid = ref(false)
const saving = ref(false)
const form = ref<VForm | null>(null)
const { data: roles } = useRoles()

const editableUser = reactive({
    id: '',
    firstname: '',
    name: '',
    email: '',
    role: null as string | null,
    avatar: null as string | null,
})
const originalUser = reactive({ ...editableUser })

// ── Avatar ────────────────────────────────────────────────────────────────
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)
const avatarInput = ref<HTMLInputElement | null>(null)

function onAvatarPicked(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
        avatarFile.value = file
        avatarPreview.value = URL.createObjectURL(file)
    }
    input.value = ''
}

function initAvatarPreview(user: EditableUserSource) {
    if (user?.avatar) {
        avatarPreview.value = usePbFileUrl(user, user.avatar, {
            thumb: '100x100',
        })
    } else if (user?.avatarUrl) {
        avatarPreview.value = user.avatarUrl
    } else {
        avatarPreview.value = null
    }
}

const { error: notifyError } = useNotification()

// ── Validation ────────────────────────────────────────────────────────────
const nameRules = [required(t), maxLength(t, 30)]

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
                email: newUser.email ?? '',
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
    const result = await form.value?.validate()
    if (!result?.valid) return

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
        notifyError(t('notifications.error.generic'))
    } finally {
        saving.value = false
    }
}
</script>

<style scoped></style>
