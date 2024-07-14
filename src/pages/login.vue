<template>
    <v-container class="login-container" fluid>
        <v-row justify="center" align="center" class="fill-height">
            <v-col cols="12" sm="8" md="4">
                <v-card class="pa-4">
                    <v-card-title class="justify-center">
                        <span class="text-h5">Login</span>
                    </v-card-title>
                    <v-card-text>
                        <v-form
                            ref="form"
                            @submit.prevent="handlePocketbaseLogin"
                        >
                            <v-text-field
                                label="Email"
                                prepend-icon="mdi-account"
                                v-model="email"
                                type="email"
                                autocomplete="email"
                                required
                                outlined
                                dense
                            ></v-text-field>

                            <v-text-field
                                label="Password"
                                prepend-icon="mdi-lock"
                                v-model="password"
                                type="password"
                                autocomplete="current-password"
                                required
                                outlined
                                dense
                            ></v-text-field>

                            <div class="text-center mt-4">
                                <v-btn
                                    :loading="loading"
                                    color="primary"
                                    large
                                    type="submit"
                                    class="mx-auto"
                                    elevation="2"
                                    rounded
                                    >Sign In</v-btn
                                >
                            </div>
                        </v-form>
                        <v-alert
                            v-if="loginFailed"
                            type="error"
                            dismissible
                            outlined
                            class="mt-4"
                        >
                            Login failed. Please check your credentials and try
                            again.
                        </v-alert>
                        <v-alert
                            v-if="loginSuccess"
                            type="success"
                            dismissible
                            outlined
                            class="mt-4"
                        >
                            Login successful. Redirecting to the Dashboard...
                        </v-alert>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const loginFailed = ref(false)
const loginSuccess = ref(false)
const loading = ref(false)
const pb = usePocketbase()
const router = useRouter()

const handlePocketbaseLogin = async () => {
    loading.value = true
    try {
        const authData = await pb.collection('users').authWithPassword(
            email.value,
            password.value,
        );

        if (authData.error) throw authData.error

        loginFailed.value = false
        loginSuccess.value = true
        router.push('/dashboard')
    } catch (error) {
        console.error('Pocketbase login failed:', error.message)
        loginSuccess.value = false
        loginFailed.value = true
    } finally {
        loading.value = false
    }
}

</script>

<style scoped></style>
