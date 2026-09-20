<template>
    <div>
        <v-btn
            color="primary"
            prepend-icon="mdi-account-plus-outline"
            data-testid="user-create-open"
            @click="dialog = true"
        >
            {{ $t('users.create') }}
        </v-btn>

        <LayoutDialogShell
            v-model="dialog"
            persistent
            data-testid="user-create-dialog"
        >
            <template #title>
                <v-avatar color="primary" variant="tonal" size="44">
                    <v-icon icon="mdi-account-plus-outline" size="22" />
                </v-avatar>
                <div>
                    <div class="text-title-large font-weight-bold">
                        {{ $t('users.create') }}
                    </div>
                    <div class="text-body-medium text-medium-emphasis">
                        {{ $t('users.createHint') }}
                    </div>
                </div>
            </template>

            <v-form ref="form" v-model="valid" @submit.prevent="submit">
                <!-- Avatar upload -->
                <div class="d-flex justify-center mb-6">
                    <div class="avatar-wrapper" @click="avatarInput?.click()">
                        <v-avatar size="80" class="avatar-ring">
                            <v-img
                                v-if="avatarPreview"
                                :src="avatarPreview"
                                :alt="$t('account.changeAvatar')"
                                cover
                            />
                            <v-icon
                                v-else
                                icon="mdi-account-outline"
                                size="40"
                                color="grey-lighten-1"
                            />
                        </v-avatar>
                        <div class="avatar-overlay">
                            <v-icon icon="mdi-camera" size="20" color="white" />
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
                </div>

                <!-- Name fields -->
                <v-row density="comfortable">
                    <v-col cols="12" sm="6">
                        <v-text-field
                            v-model="user.firstname"
                            :rules="nameRules"
                            :label="$t('account.firstname')"
                            :placeholder="$t('account.placeholders.firstname')"
                            prepend-inner-icon="mdi-account-outline"
                            data-testid="user-create-firstname"
                        />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field
                            v-model="user.name"
                            :rules="nameRules"
                            :label="$t('account.lastname')"
                            :placeholder="$t('account.placeholders.lastname')"
                            prepend-inner-icon="mdi-account-outline"
                            data-testid="user-create-lastname"
                        />
                    </v-col>
                </v-row>

                <!-- Email -->
                <v-text-field
                    v-model="user.email"
                    :rules="emailRules"
                    :label="$t('account.email')"
                    type="email"
                    prepend-inner-icon="mdi-email-outline"
                    class="mb-1"
                    data-testid="user-create-email"
                />

                <!-- Role -->
                <v-select
                    v-model="user.role"
                    :items="roles"
                    item-title="name"
                    item-value="id"
                    :label="$t('users.role')"
                    prepend-inner-icon="mdi-shield-account-outline"
                    clearable
                    data-testid="user-create-role"
                />
            </v-form>
            <template #actions>
                <v-btn
                    variant="text"
                    data-testid="user-create-cancel"
                    @click="closeDialog"
                >
                    {{ $t('actions.cancel') }}
                </v-btn>
                <v-spacer />
                <v-btn
                    :disabled="!valid"
                    :loading="saving"
                    color="primary"
                    prepend-icon="mdi-check"
                    data-testid="user-create-submit"
                    @click="submit"
                >
                    {{ $t('actions.create') }}
                </v-btn>
            </template>
        </LayoutDialogShell>
    </div>
</template>

<script setup>
import { required, maxLength, validEmail } from '~/utils/validation'

const { t } = useI18n()
const pb = usePocketbase()
const emit = defineEmits(['user-created', 'closed'])

const dialog = ref(false)
const valid = ref(false)
const saving = ref(false)
const form = ref(null)
const roles = ref([])

const user = reactive({
    email: '',
    emailVisibility: true,
    name: '',
    firstname: '',
    role: null,
})

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

const { notify, error: notifyError } = useNotification()

// ── Roles ─────────────────────────────────────────────────────────────────
async function fetchRoles() {
    try {
        roles.value = await pb.collection('roles').getFullList({
            sort: 'name',
            requestKey: 'createUserRoles',
        })
    } catch (err) {
        console.error('Failed to fetch roles:', err)
        notifyError(t('users.rolesLoadError'))
    }
}

onMounted(fetchRoles)

// ── Validation ────────────────────────────────────────────────────────────
const nameRules = [required(t), maxLength(t, 30)]
const emailRules = [required(t), validEmail(t)]

function closeDialog() {
    dialog.value = false
    form.value?.reset()
    form.value?.resetValidation()
    avatarFile.value = null
    avatarPreview.value = null
    emit('closed')
}

// ── Submit ────────────────────────────────────────────────────────────────
async function submit() {
    const { valid: formValid } = await form.value.validate()
    if (!formValid) return

    saving.value = true
    try {
        // Generate username from firstname + lastname
        const username = ((user.firstname || '') + (user.name || ''))
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')

        // Generate a random password (user will reset via email)
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
        notify(t('notifications.success.userCreated'))
        emit('user-created')
        closeDialog()
    } catch (error) {
        console.error('Error creating user:', error)
        const message =
            error.data?.data?.email?.message ||
            error.data?.data?.username?.message ||
            t('notifications.error.generic')
        notifyError(message)
    } finally {
        saving.value = false
    }
}
</script>

<style scoped></style>
