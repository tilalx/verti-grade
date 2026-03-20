<template>
    <div>
        <v-btn @click="dialog = true" color="primary">{{ $t('users.create') }}</v-btn>
        <v-dialog v-model="dialog" persistent max-width="600px">
            <v-card>
                <v-card-title>{{ $t('users.create') }}</v-card-title>
                <v-card-text>
                    <v-form
                        ref="form"
                        v-model="valid"
                        @submit.prevent="submit"
                        lazy-validation
                    >
                        <v-text-field
                            v-model="user.username"
                            :rules="usernameRules"
                            :label="$t('account.username')"
                            required
                        ></v-text-field>
                        <v-text-field
                            v-model="user.firstname"
                            :rules="nameRules"
                            :label="$t('account.firstname')"
                            required
                        ></v-text-field>
                        <v-text-field
                            v-model="user.name"
                            :rules="nameRules"
                            :label="$t('account.lastname')"
                            required
                        ></v-text-field>
                        <v-text-field
                            v-model="user.email"
                            :rules="emailRules"
                            :label="$t('account.email')"
                            type="email"
                            required
                        ></v-text-field>
                        <v-text-field
                            v-model="user.password"
                            :rules="passwordRules"
                            :label="$t('account.password')"
                            type="password"
                            required
                        ></v-text-field>
                        <v-text-field
                            v-model="user.passwordConfirm"
                            :rules="passwordConfirmRules"
                            :label="$t('account.confirmPassword')"
                            type="password"
                            required
                        ></v-text-field>
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="closeDialog">{{ $t('actions.cancel') }}</v-btn>
                    <v-btn
                        :disabled="!valid"
                        color="primary"
                        @click="submit"
                    >{{ $t('actions.create') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000" top>
            {{ snackbarMessage }}
        </v-snackbar>
    </div>
</template>

<script setup>
import { required, minLength, maxLength, validEmail, passwordsMatch } from '~/utils/validation'

const { t } = useI18n()
const pb = usePocketbase()
const emit = defineEmits(['user-created', 'closed'])

const dialog = ref(false)
const valid = ref(false)
const form = ref(null)

const user = reactive({
    username: '',
    email: '',
    emailVisibility: true,
    password: '',
    passwordConfirm: '',
    name: '',
    firstname: '',
})

// --- Snackbar ---
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

function showSnackbar(message, color = 'success') {
    snackbarMessage.value = message
    snackbarColor.value = color
    snackbar.value = true
}

// --- Validation Rules ---
const nameRules = [required(t), maxLength(t, 30)]
const usernameRules = [required(t), minLength(t, 3)]
const emailRules = [required(t), validEmail(t)]
const passwordRules = [required(t), minLength(t, 8)]
const passwordConfirmRules = computed(() => [required(t), passwordsMatch(t, () => user.password)])

function openDialog() {
    dialog.value = true
}

function closeDialog() {
    dialog.value = false
    form.value?.reset()
    form.value?.resetValidation()
    emit('closed')
}

async function submit() {
    const { valid: formValid } = await form.value.validate()
    if (!formValid) {
        return
    }

    try {
        await pb.collection('users').create(user)
        showSnackbar(t('notifications.success.userCreated'), 'success')
        emit('user-created')
        closeDialog()
    } catch (error) {
        console.error('Error creating user:', error)
        const message = error.data?.data?.username?.message || t('notifications.error.generic')
        showSnackbar(message, 'error')
    }
}
</script>