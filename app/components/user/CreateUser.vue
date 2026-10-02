<template>
    <div>
        <UButton
            color="primary"
            icon="i-lucide-user-plus"
            data-testid="user-create-open"
            @click="dialog = true"
        >
            {{ $t('users.create') }}
        </UButton>

        <LayoutDialogShell
            v-model="dialog"
            persistent
            data-testid="user-create-dialog"
        >
            <template #title>
                <span
                    class="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                    <UIcon name="i-lucide-user-plus" class="size-[22px]" />
                </span>
                <div>
                    <div class="text-[1.375rem] leading-7 font-bold">
                        {{ $t('users.create') }}
                    </div>
                    <div class="text-sm text-muted">
                        {{ $t('users.createHint') }}
                    </div>
                </div>
            </template>

            <UAlert
                v-if="!mailConfigured"
                color="warning"
                variant="soft"
                icon="i-lucide-mail-x"
                class="mb-4"
                data-testid="user-create-mail-warning"
                :description="$t('users.inviteMailNotConfigured')"
            />

            <UForm
                ref="form"
                :state="user"
                :validate="validateForm"
                @submit="submit"
            >
                <div class="flex justify-center mb-6">
                    <UTooltip :text="$t('account.changeAvatar')">
                        <div
                            class="avatar-wrapper"
                            role="button"
                            tabindex="0"
                            :aria-label="$t('account.changeAvatar')"
                            data-testid="user-create-avatar-upload"
                            @click="avatarInput?.click()"
                            @keydown.enter.prevent="avatarInput?.click()"
                            @keydown.space.prevent="avatarInput?.click()"
                        >
                            <UAvatar
                                :src="avatarPreview || undefined"
                                :alt="$t('account.changeAvatar')"
                                icon="i-lucide-user"
                                class="avatar-ring size-20 text-[40px]"
                            />
                            <div class="avatar-overlay">
                                <UIcon
                                    name="i-lucide-camera"
                                    class="size-[20px] text-white"
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
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <UFormField
                        :label="$t('account.firstname')"
                        name="firstname"
                    >
                        <UInput
                            v-model="user.firstname"
                            :placeholder="$t('account.placeholders.firstname')"
                            icon="i-lucide-user"
                            class="w-full"
                            data-testid="user-create-firstname"
                        />
                    </UFormField>
                    <UFormField :label="$t('account.lastname')" name="name">
                        <UInput
                            v-model="user.name"
                            :placeholder="$t('account.placeholders.lastname')"
                            icon="i-lucide-user"
                            class="w-full"
                            data-testid="user-create-lastname"
                        />
                    </UFormField>
                </div>

                <UFormField
                    :label="$t('account.email')"
                    name="email"
                    class="mb-4"
                >
                    <UInput
                        v-model="user.email"
                        type="email"
                        icon="i-lucide-mail"
                        class="w-full"
                        data-testid="user-create-email"
                    />
                </UFormField>

                <UFormField :label="$t('users.role')" name="role">
                    <USelectMenu
                        v-model="user.role"
                        :items="roleItems"
                        value-key="value"
                        :search-input="false"
                        icon="i-lucide-shield-user"
                        clear
                        class="w-full"
                        data-testid="user-create-role"
                    />
                </UFormField>
            </UForm>
            <template #actions>
                <UButton
                    color="neutral"
                    variant="ghost"
                    data-testid="user-create-cancel"
                    @click="closeDialog"
                >
                    {{ $t('actions.cancel') }}
                </UButton>
                <div class="flex-1" />
                <UButton
                    :disabled="!valid"
                    :loading="saving"
                    color="primary"
                    icon="i-lucide-check"
                    data-testid="user-create-submit"
                    @click="submit"
                >
                    {{ $t('actions.create') }}
                </UButton>
            </template>
        </LayoutDialogShell>
    </div>
</template>

<script setup lang="ts">
import type { ClientResponseError } from 'pocketbase'
import type { Form } from '@nuxt/ui'
import {
    required,
    maxLength,
    validEmail,
    validateRules,
} from '~/utils/validation'

const { t } = useI18n()
const pb = usePocketbase()
const emit = defineEmits<{ 'user-created': []; closed: [] }>()

const dialog = ref(false)
const saving = ref(false)
const form = ref<Form<typeof user> | null>(null)
const { data: roles } = useRoles()
const roleItems = computed(() =>
    (roles.value ?? []).map((role) => ({ label: role.name, value: role.id })),
)

const user = reactive({
    email: '',
    emailVisibility: true,
    name: '',
    firstname: '',
    role: null as string | null,
})

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

const { notify, error: notifyError } = useNotification()

const { data: mailStatus } = useMailStatus()
const mailConfigured = computed(() => mailStatus.value?.configured !== false)

// ── Validation ────────────────────────────────────────────────────────────
const nameRules = [required(t), maxLength(t, 30)]
const emailRules = [required(t), validEmail(t)]
const validateForm = (state: Record<string, unknown>) =>
    validateRules(state, {
        firstname: nameRules,
        name: nameRules,
        email: emailRules,
    })
const valid = computed(() => validateForm(user).length === 0)

function closeDialog() {
    dialog.value = false
    Object.assign(user, { email: '', name: '', firstname: '', role: null })
    form.value?.clear()
    avatarFile.value = null
    avatarPreview.value = null
    emit('closed')
}

// ── Submit ────────────────────────────────────────────────────────────────
async function submit() {
    if ((await form.value?.validate({ silent: true })) === false) return

    saving.value = true
    try {
        const nameStem = ((user.firstname || '') + (user.name || ''))
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 140)
        const uniqueDigits = String(
            crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000,
        ).padStart(6, '0')
        const username = `${nameStem || 'user'}${uniqueDigits}`

        const randomPassword = crypto.randomUUID()

        const formData = new FormData()
        formData.append('username', username)
        formData.append('firstname', user.firstname)
        formData.append('name', user.name)
        formData.append('email', user.email)
        formData.append('emailVisibility', 'true')
        formData.append('password', randomPassword)
        formData.append('passwordConfirm', randomPassword)
        if (user.role) formData.append('role', user.role)
        if (avatarFile.value) formData.append('avatar', avatarFile.value)

        await pb.collection('users').create(formData)

        try {
            if (mailConfigured.value) {
                await pb.collection('users').requestPasswordReset(user.email)
                notify(t('notifications.success.userInvited'))
            } else {
                notify(
                    t('notifications.success.userCreatedNoInvite'),
                    'warning',
                )
            }
        } catch (mailError) {
            console.error('Error sending invite email:', mailError)
            notifyError(t('notifications.error.userInviteMail'))
        }

        emit('user-created')
        closeDialog()
    } catch (error) {
        console.error('Error creating user:', error)
        const fieldErrors = (error as ClientResponseError).data?.data
        if (fieldErrors?.email?.code === 'validation_not_unique')
            notifyError(t('users.emailTaken'))
        else if (fieldErrors?.email) notifyError(t('validation.email'))
        else if (fieldErrors?.username?.code === 'validation_not_unique')
            notifyError(t('users.usernameTaken'))
        else notifyError(t('notifications.error.generic'))
    } finally {
        saving.value = false
    }
}
</script>

<style scoped></style>
