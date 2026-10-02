<template>
    <LayoutDialogShell
        v-model="dialog"
        :persistent="hasChanges"
        data-testid="user-edit-dialog"
    >
        <template #title>
            <UTooltip
                :text="$t('account.changeAvatar')"
                ignore-non-keyboard-focus
            >
                <div
                    class="avatar-wrapper"
                    role="button"
                    tabindex="0"
                    :aria-label="$t('account.changeAvatar')"
                    data-testid="user-edit-avatar-upload"
                    @click="avatarInput?.click()"
                    @keydown.enter.prevent="avatarInput?.click()"
                    @keydown.space.prevent="avatarInput?.click()"
                >
                    <UAvatar
                        :src="avatarPreview || undefined"
                        :alt="$t('account.changeAvatar')"
                        icon="i-lucide-user"
                        class="avatar-ring size-16 text-[32px]"
                    />
                    <div class="avatar-overlay">
                        <UIcon
                            name="i-lucide-camera"
                            class="size-[18px] text-white"
                        />
                    </div>
                </div>
            </UTooltip>
            <input
                type="file"
                ref="avatarInput"
                accept="image/jpeg,image/png,image/svg+xml,image/webp"
                class="hidden"
                @change="onAvatarPicked"
            />

            <div class="grow overflow-hidden">
                <div class="text-[1.375rem] leading-7 font-bold truncate">
                    {{ $t('users.edit') }}
                </div>
                <div class="text-sm text-muted truncate">
                    {{ editableUser.email }}
                </div>
            </div>
        </template>

        <UForm ref="form" :state="editableUser" :validate="validateForm">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <UFormField :label="$t('account.firstname')" name="firstname">
                    <UInput
                        v-model="editableUser.firstname"
                        :placeholder="$t('account.placeholders.firstname')"
                        icon="i-lucide-user"
                        class="w-full"
                        data-testid="user-edit-firstname"
                    />
                </UFormField>
                <UFormField :label="$t('account.lastname')" name="name">
                    <UInput
                        v-model="editableUser.name"
                        :placeholder="$t('account.placeholders.lastname')"
                        icon="i-lucide-user"
                        class="w-full"
                        data-testid="user-edit-lastname"
                    />
                </UFormField>
            </div>

            <UFormField :label="$t('account.email')" class="mb-4">
                <UInput
                    :model-value="editableUser.email"
                    icon="i-lucide-mail"
                    disabled
                    class="w-full"
                >
                    <template #trailing>
                        <UTooltip :text="$t('account.emailLocked')">
                            <UIcon name="i-lucide-lock" class="size-[18px]" />
                        </UTooltip>
                    </template>
                </UInput>
            </UFormField>

            <UFormField :label="$t('users.role')" name="role">
                <USelectMenu
                    v-model="editableUser.role"
                    :items="roleItems"
                    value-key="value"
                    :search-input="false"
                    icon="i-lucide-shield-user"
                    clear
                    class="w-full"
                    data-testid="user-edit-role"
                />
            </UFormField>
        </UForm>
        <template #actions>
            <UButton
                color="neutral"
                variant="ghost"
                data-testid="user-edit-cancel"
                @click="close"
            >
                {{ $t('actions.cancel') }}
            </UButton>
            <div class="flex-1" />
            <UBadge
                v-if="hasChanges"
                color="warning"
                variant="soft"
                icon="i-lucide-pencil"
                class="mr-2"
            >
                {{ $t('account.unsavedChanges') }}
            </UBadge>
            <UButton
                :disabled="!valid || !hasChanges"
                :loading="saving"
                color="primary"
                icon="i-lucide-save"
                data-testid="user-edit-submit"
                @click="save"
            >
                {{ $t('actions.save') }}
            </UButton>
        </template>
    </LayoutDialogShell>
</template>

<script setup lang="ts">
import type { Form } from '@nuxt/ui'
import { required, maxLength, validateRules } from '~/utils/validation'
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
const saving = ref(false)
const form = ref<Form<typeof editableUser> | null>(null)
const { data: roles } = useRoles()
const roleItems = computed(() =>
    (roles.value ?? []).map((role) => ({ label: role.name, value: role.id })),
)

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
const validateForm = (state: Record<string, unknown>) =>
    validateRules(state, { firstname: nameRules, name: nameRules })
const valid = computed(() => validateForm(editableUser).length === 0)

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

watch(dialog, (open) => {
    if (!open) emit('close')
})

function close() {
    dialog.value = false
}

// ── Save ──────────────────────────────────────────────────────────────────
async function save() {
    if ((await form.value?.validate({ silent: true })) === false) return

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
