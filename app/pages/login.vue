<template>
    <v-container class="login-container" fluid>
        <v-row justify="center" align="center" class="fill-height">
            <v-col cols="12" sm="8" md="4">
                <v-card class="pa-4">
                    <v-card-title class="text-center">
                        <h2>
                            {{
                                view === 'login'
                                    ? $t('account.login')
                                    : $t('account.reset_password')
                            }}
                        </h2>
                    </v-card-title>
                    <v-divider></v-divider>
                    <v-card-text>
                        <!-- Login Form -->
                        <v-form
                            v-if="view === 'login'"
                            ref="form"
                            @submit.prevent="handlePocketbaseLogin"
                        >
                            <v-text-field
                                :label="$t('account.email')"
                                prepend-icon="mdi-account"
                                v-model="email"
                                type="email"
                                autocomplete="email"
                                required
                                outlined
                                dense
                                class="mt-4"
                            ></v-text-field>
                            <v-text-field
                                :label="$t('account.password')"
                                prepend-icon="mdi-lock"
                                v-model="password"
                                type="password"
                                autocomplete="current-password"
                                required
                                outlined
                                dense
                                class="mt-4"
                            ></v-text-field>
                            <v-row class="text-center mt-2 mb-4">
                                <v-col cols="12" class="text-right">
                                    <small
                                        @click="view = 'requestReset'"
                                        class="reset-link"
                                        >{{
                                            $t('account.reset_password')
                                        }}</small
                                    >
                                </v-col>
                            </v-row>
                            <v-row class="text-center mt-2">
                                <v-col cols="12">
                                    <v-btn
                                        :loading="loading"
                                        color="primary"
                                        large
                                        type="submit"
                                        elevation="2"
                                        rounded
                                        block
                                        >{{ $t('account.login') }}</v-btn
                                    >
                                </v-col>
                            </v-row>
                            <v-row class="text-center mt-2">
                                <v-col cols="12">
                                    <v-btn text @click="navigateHome" block>{{
                                        $t('actions.back_to_home')
                                    }}</v-btn>
                                </v-col>
                            </v-row>
                        </v-form>
                        <!-- Request Password Reset Form -->
                        <v-form
                            v-if="view === 'requestReset'"
                            ref="resetForm"
                            @submit.prevent="handleRequestPasswordReset"
                        >
                            <v-text-field
                                :label="$t('account.email')"
                                prepend-icon="mdi-email"
                                v-model="resetEmail"
                                type="email"
                                autocomplete="email"
                                required
                                outlined
                                dense
                                class="mt-4"
                            ></v-text-field>
                            <v-row class="text-center mt-4">
                                <v-col cols="12">
                                    <v-btn
                                        color="primary"
                                        large
                                        type="submit"
                                        elevation="2"
                                        rounded
                                        block
                                        >{{ $t('actions.submit') }}</v-btn
                                    >
                                </v-col>
                                <v-col cols="12">
                                    <v-btn text @click="view = 'login'" block>{{
                                        $t('actions.cancel')
                                    }}</v-btn>
                                </v-col>
                                <v-col cols="12">
                                    <v-btn text @click="navigateHome" block>{{
                                        $t('actions.back_to_home')
                                    }}</v-btn>
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
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
const { t } = useI18n()
const pb = usePocketbase()
const router = useRouter()

useHead({
    title: t('page.title.login'),
    meta: [
        {
            name: 'description',
            content: t('page.content.login'),
            authRequired: false,
        },
    ],
})

// Check if the user is already logged in
if (pb.authStore.isValid) {
    router.push('/dashboard')
}

// Set navbar visibility
router.currentRoute.value.meta.navbar = false

const email = ref('')
const password = ref('')
const resetEmail = ref('')
const loading = ref(false)
const view = ref('login') // Tracks the current view

// Snackbar state
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('')

const handlePocketbaseLogin = async () => {
    loading.value = true
    try {
        const authData = await pb
            .collection('users')
            .authWithPassword(email.value, password.value)
        if (authData.error) throw authData.error

        showSnackbar(t('notifications.success.login'), 'success')
        router.push('/dashboard')
    } catch (error) {
        console.error('Pocketbase login failed:', error.message)
        showSnackbar(t('notifications.error.login_failed'), 'error')
    } finally {
        loading.value = false
    }
}

const handleRequestPasswordReset = async () => {
    try {
        await pb.collection('users').requestPasswordReset(resetEmail.value)
        showSnackbar(t('notifications.success.resetPassword'), 'success')
        view.value = 'login'
    } catch (error) {
        console.error('Password reset request failed:', error.message)
        showSnackbar(t('notifications.error.resetPassword'), 'error')
    }
}

const navigateHome = () => {
    router.push('/')
}

const showSnackbar = (message, color) => {
    snackbarMessage.value = message
    snackbarColor.value = color
    snackbar.value = true
}
</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.reset-link {
    cursor: pointer;
    color: #1976d2;
    text-decoration: underline;
    font-size: 1rem;
}
</style>
