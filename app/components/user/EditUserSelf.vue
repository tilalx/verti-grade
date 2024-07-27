<template>
    <v-dialog v-model="localDialog" max-width="600">
        <v-card prepend-icon="mdi-account" :title="$t('account.userProfile')">
            <v-card-text>
                <v-form>
                    <v-row dense>
                        <v-col cols="12" md="4" sm="6">
                            <v-text-field
                                v-model="user.firstname"
                                :label="$t('account.firstname')"
                                autocomplete="given-name"
                                required
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12" md="4" sm="6">
                            <v-text-field
                                v-model="user.name"
                                :label="$t('account.lastname')"
                                autocomplete="family-name"
                                persistent-hint
                                required
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12" md="4" sm="6">
                            <v-text-field
                                v-model="user.email"
                                :label="$t('account.email')"
                                autocomplete="email"
                                required
                                :disabled="true"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12" md="4" sm="6">
                            <v-text-field
                                v-model="user.oldPassword"
                                :label="$t('account.oldPassword')"
                                type="password"
                                autocomplete="current-password"
                                required
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12" md="4" sm="6">
                            <v-text-field
                                v-model="user.password"
                                :label="$t('account.password')"
                                type="password"
                                autocomplete="new-password"
                                required
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12" md="4" sm="6">
                            <v-text-field
                                v-model="user.passwordConfirm"
                                :label="$t('account.newPassword')"
                                type="password"
                                autocomplete="new-password"
                                required
                            ></v-text-field>
                        </v-col>
                    </v-row>
                </v-form>
                <v-snackbar v-model="snackbar" :color="snackbarColor" top timeout="5000">
                    {{ snackbarMessage }}
                </v-snackbar>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
                <v-spacer></v-spacer>

                <v-btn
                    text="Close"
                    @click="localDialog = false"
                ></v-btn>

                <v-btn
                    color="primary"
                    text="Save"
                    @click="saveUser"
                ></v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const pb = usePocketbase()
const pocketbaseAuth = JSON.parse(localStorage.getItem('pocketbase_auth'))
const user = ref(
    pocketbaseAuth ? pocketbaseAuth.model : {
        id: '',
        firstname: '',
        name: '',
        email: '',
        oldPassword: '',
        password: '',
        passwordConfirm: '',
    },
)
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('')

const saveUser = async () => {
    if (!verifyValues()) {
        return
    }
    try {
        const response = await pb.collection('users').update(user.value.id, user.value)
        if (response.error) {
            showSnackbar(response.error, 'error')
            return
        }
        showSnackbar('User updated successfully', 'success')
        user.value.oldPassword = '';
        user.value.password = '';
        user.value.passwordConfirm = '';
        localDialog.value = false
    } catch (error) {
        if(error.response.code === 400) {
            showSnackbar('Old password is incorrect', 'error')
        } else {
            showSnackbar('An error occurred', 'error')
        }
    }
}

const verifyValues = () => {
    if(!user.value.oldPassword || !user.value.password || !user.value.passwordConfirm) {
        return true
    }

    if (user.value.password !== user.value.passwordConfirm) {
        showSnackbar('Passwords do not match', 'error')
        return false
    }
    if (user.value.password.length < 8) {
        showSnackbar('Password must be at least 8 characters long', 'error')
        return false
    }
    if (user.value.password.length > 72) {
        showSnackbar('Password must be less than 72 characters long', 'error')
        return false
    }
    return true
}

const showSnackbar = (message, color) => {
    snackbarMessage.value = message
    snackbarColor.value = color
    snackbar.value = true
}

const props = defineProps({
    dialogOpen: {
        type: Boolean,
        required: true,
    }
})

const emit = defineEmits(['update:dialogOpen'])

const localDialog = ref(props.dialogOpen)

watch(localDialog, (newVal) => {
    emit('update:dialogOpen', newVal)
})

watch(
    () => props.dialogOpen,
    (newVal) => {
        localDialog.value = newVal
    },
)
</script>
