<template>
    <div>
        <v-btn
            @click="dialog = true"
            color="primary"
            variant="tonal"
            rounded="lg"
            prepend-icon="mdi-account-plus-outline"
        >
            {{ $t('users.create') }}
        </v-btn>

        <v-dialog v-model="dialog" max-width="520" persistent>
            <v-card rounded="xl" elevation="8">
                <!-- Header -->
                <div class="dialog-header pa-6 pb-4">
                    <div class="d-flex align-center ga-3">
                        <v-avatar color="primary" variant="tonal" size="44">
                            <v-icon icon="mdi-account-plus-outline" size="22" />
                        </v-avatar>
                        <div>
                            <div class="text-h6 font-weight-bold">
                                {{ $t('users.create') }}
                            </div>
                            <div class="text-body-2 text-medium-emphasis">
                                {{ $t('users.createHint') }}
                            </div>
                        </div>
                    </div>
                </div>

                <v-divider />

                <v-card-text class="pa-6">
                    <v-form
                        ref="form"
                        v-model="valid"
                        @submit.prevent="submit"
                    >
                        <!-- Avatar upload -->
                        <div class="d-flex justify-center mb-6">
                            <div
                                class="avatar-wrapper"
                                @click="avatarInput?.click()"
                            >
                                <v-avatar size="80" class="avatar-ring">
                                    <v-img
                                        v-if="avatarPreview"
                                        :src="avatarPreview"
                                        cover
                                    />
                                    <v-icon
                                        v-else
                                        icon="mdi-account"
                                        size="40"
                                        color="grey-lighten-1"
                                    />
                                </v-avatar>
                                <div class="avatar-overlay">
                                    <v-icon
                                        icon="mdi-camera"
                                        size="20"
                                        color="white"
                                    />
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
                                    v-model="user.name"
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

                        <!-- Email -->
                        <v-text-field
                            v-model="user.email"
                            :rules="emailRules"
                            :label="$t('account.email')"
                            type="email"
                            prepend-inner-icon="mdi-email-outline"
                            variant="outlined"
                            density="comfortable"
                            rounded="lg"
                            class="mb-1"
                        />

                        <!-- Role -->
                        <v-select
                            v-model="user.role"
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
                    <v-btn variant="text" @click="closeDialog">
                        {{ $t('actions.cancel') }}
                    </v-btn>
                    <v-spacer />
                    <v-btn
                        :disabled="!valid"
                        :loading="saving"
                        color="primary"
                        variant="flat"
                        rounded="lg"
                        prepend-icon="mdi-check"
                        @click="submit"
                    >
                        {{ $t('actions.create') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar
            v-model="snackbar"
            :color="snackbarColor"
            location="top"
            rounded="pill"
            timeout="4000"
        >
            <div class="d-flex align-center ga-2">
                <v-icon
                    :icon="
                        snackbarColor === 'success'
                            ? 'mdi-check-circle-outline'
                            : 'mdi-alert-circle-outline'
                    "
                />
                {{ snackbarMessage }}
            </div>
        </v-snackbar>
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

// ── Roles ─────────────────────────────────────────────────────────────────
async function fetchRoles() {
    try {
        roles.value = await pb.collection('roles').getFullList({
            sort: 'name',
            requestKey: 'createUserRoles',
        })
    } catch (err) {
        console.error('Failed to fetch roles:', err)
    }
}

onMounted(fetchRoles)

// ── Snackbar ──────────────────────────────────────────────────────────────
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

function showSnackbar(message, color = 'success') {
    snackbarMessage.value = message
    snackbarColor.value = color
    snackbar.value = true
}

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
        const username = (
            (user.firstname || '') +
            (user.name || '')
        )
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
        showSnackbar(t('notifications.success.userCreated'), 'success')
        emit('user-created')
        closeDialog()
    } catch (error) {
        console.error('Error creating user:', error)
        const message =
            error.data?.data?.email?.message ||
            error.data?.data?.username?.message ||
            t('notifications.error.generic')
        showSnackbar(message, 'error')
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
