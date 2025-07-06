<template>
    <v-dialog v-model="localDialog" max-width="600">
        <v-card class="position-relative" style="overflow: visible">
            <!-- Card Title with clickable avatar -->
            <v-card-title class="d-flex align-center">
                <v-avatar
                    color="grey"
                    class="mr-4 cursor-pointer"
                    @click="openAvatarPicker"
                >
                    <NuxtImg
                        v-if="avatarPreview"
                        :src="avatarPreview"
                        contain
                    />
                    <v-icon
                        v-else
                        icon="mdi-account-circle"
                        alt="user-icon"
                        size="40"
                    />
                </v-avatar>
                {{ $t('account.userProfile') }}
            </v-card-title>

            <v-card-text>
                <!-- hidden native file input -->
                <input
                    type="file"
                    ref="avatarInput"
                    accept="image/jpeg,image/png,image/svg+xml,image/webp"
                    style="display: none"
                    @change="onAvatarNative"
                />

                <v-form>
                    <v-row dense>
                        <v-col cols="12" md="4" sm="6">
                            <v-text-field
                                v-model="user.firstname"
                                :label="$t('account.firstname')"
                                autocomplete="given-name"
                                required
                            />
                        </v-col>

                        <v-col cols="12" md="4" sm="6">
                            <v-text-field
                                v-model="user.name"
                                :label="$t('account.lastname')"
                                autocomplete="family-name"
                                required
                            />
                        </v-col>

                        <v-col cols="12" md="4" sm="6">
                            <v-text-field
                                v-model="user.email"
                                :label="$t('account.email')"
                                autocomplete="email"
                                required
                                :disabled="true"
                            />
                        </v-col>

                        <v-col cols="12" md="4" sm="6">
                            <v-text-field
                                v-model="user.oldPassword"
                                :label="$t('account.oldPassword')"
                                type="password"
                                autocomplete="current-password"
                                required
                            />
                        </v-col>

                        <v-col cols="12" md="4" sm="6">
                            <v-text-field
                                v-model="user.password"
                                :label="$t('account.password')"
                                type="password"
                                autocomplete="new-password"
                                required
                            />
                        </v-col>

                        <v-col cols="12" md="4" sm="6">
                            <v-text-field
                                v-model="user.passwordConfirm"
                                :label="$t('account.newPassword')"
                                type="password"
                                autocomplete="new-password"
                                required
                            />
                        </v-col>
                    </v-row>
                </v-form>

                <v-snackbar
                    v-model="snackbar"
                    :color="snackbarColor"
                    top
                    timeout="5000"
                >
                    {{ snackbarMessage }}
                </v-snackbar>
            </v-card-text>

            <v-divider />

            <v-card-actions>
                <v-spacer />
                <v-btn text @click="localDialog = false">
                    {{ $t('actions.cancel') }}
                </v-btn>
                <v-btn
                    :color="hasChanges ? 'success' : 'primary'"
                    :disabled="!hasChanges"
                    @click="saveUser"
                >
                    {{ $t('actions.save') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'

const pb = usePocketbase()
const pocketbaseAuth = JSON.parse(localStorage.getItem('pocketbase_auth'))

// reactive user record
const user = reactive(
    pocketbaseAuth?.record ?? {
        id: '',
        firstname: '',
        name: '',
        email: '',
        oldPassword: '',
        password: '',
        passwordConfirm: '',
        avatar: null,
    },
)

// --- Avatar state & handlers ---
const avatarFile = ref(null)
const avatarPreview = ref(null)
const avatarInput = ref(null)

onMounted(() => {
    avatarPreview.value = user.avatar
        ? pb.files.getURL(user, user.avatar, { thumb: '100x100' })
        : null
})

function openAvatarPicker() {
    avatarInput.value?.click()
}

function onAvatarNative(e) {
    const file = e.target.files?.[0]
    if (file) onAvatarSelected(file)
    e.target.value = ''
}

function onAvatarSelected(file) {
    avatarFile.value = file
    avatarPreview.value = URL.createObjectURL(file)
}

// --- Snackbar ---
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('')

function showSnackbar(message, color) {
    snackbarMessage.value = message
    snackbarColor.value = color
    snackbar.value = true
}

// --- Password validation ---
function verifyValues() {
    if (!user.oldPassword && !user.password && !user.passwordConfirm) {
        return true
    }
    if (!user.oldPassword || !user.password || !user.passwordConfirm) {
        showSnackbar(
            'Please fill all password fields to change password',
            'error',
        )
        return false
    }
    if (user.password !== user.passwordConfirm) {
        showSnackbar('Passwords do not match', 'error')
        return false
    }
    if (user.password.length < 8) {
        showSnackbar('Password must be at least 8 characters', 'error')
        return false
    }
    if (user.password.length > 72) {
        showSnackbar('Password must be less than 72 characters', 'error')
        return false
    }
    return true
}

// --- Change detection for Save button ---
const original = {
    firstname: user.firstname,
    name: user.name,
}

const hasChanges = computed(() => {
    if (avatarFile.value) return true
    return user.firstname !== original.firstname || user.name !== original.name
})

// --- Save user + avatar ---
async function saveUser() {
    if (!verifyValues()) return

    const formData = new FormData()
    formData.append('firstname', user.firstname)
    formData.append('name', user.name)
    if (user.oldPassword) {
        formData.append('oldPassword', user.oldPassword)
        formData.append('password', user.password)
        formData.append('passwordConfirm', user.passwordConfirm)
    }
    if (avatarFile.value) {
        formData.append('avatar', avatarFile.value)
    }

    try {
        const updated = await pb.collection('users').update(user.id, formData)

        Object.assign(user, updated)
        if (updated.avatar) {
            avatarPreview.value = pb.files.getURL(updated, updated.avatar, {
                thumb: '100x100',
            })
        }
        user.oldPassword = ''
        user.password = ''
        user.passwordConfirm = ''
        avatarFile.value = null

        const auth = JSON.parse(localStorage.getItem('pocketbase_auth'))
        auth.record = updated
        localStorage.setItem('pocketbase_auth', JSON.stringify(auth))

        original.firstname = updated.firstname
        original.name = updated.name

        showSnackbar('Profile updated successfully', 'success')
        localDialog.value = false
    } catch (err) {
        const code = err?.response?.data?.code
        if (code === 400) {
            showSnackbar('Old password is incorrect', 'error')
        } else {
            showSnackbar('An error occurred', 'error')
        }
    }
}

// --- Dialog v-model wiring ---
const props = defineProps({
    dialogOpen: { type: Boolean, required: true },
})
const emit = defineEmits(['update:dialogOpen'])
const localDialog = ref(props.dialogOpen)

watch(localDialog, (val) => emit('update:dialogOpen', val))
watch(
    () => props.dialogOpen,
    (val) => (localDialog.value = val),
)
</script>
