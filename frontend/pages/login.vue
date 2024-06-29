<template>
    <v-container class="login-container">
        <v-row justify="center" align="center" style="height: 100vh;">
            <v-col cols="12" sm="12" md="4">
                <v-card>
                    <v-card-title class="text-center">
                        <h1>Login</h1>
                    </v-card-title>
                    <v-divider></v-divider>
                    <v-card-text>
                        <v-form @submit.prevent="handleSupabaseLogin">
                            <v-text-field
                                v-model="email"
                                label="Email"
                                type="email"
                                autocomplete="email"
                                required
                            ></v-text-field>
                            <v-text-field
                                v-model="password"
                                :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                @click:append="showPassword = !showPassword"
                                :type="showPassword ? 'text' : 'password'"
                                label="Password"
                                autocomplete="current-password"
                                required
                            ></v-text-field>
                            <v-spacer></v-spacer>
                            <v-btn tspe="submit" color="primary" @click="handleSupabaseLogin">Login</v-btn>
                        </v-form>
                    </v-card-text>
                </v-card>
                <v-alert
                    v-if="loginFailed"
                    type="error"
                    dismissible
                    outlined
                    class="mt-4"
                >
                    Login failed. Please check your credentials and try again.
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
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import { ref } from 'vue';

export default {
    setup() {
        const email = ref('');
        const password = ref('');
        const loginFailed = ref(false);
        const loginSuccess = ref(false);
        const showPassword = ref(false);
        const supabase = useSupabaseClient()

        const handleSupabaseLogin = async () => {
            try {
                const { user, error } = await supabase.auth.signInWithPassword({
                    email: email.value,
                    password: password.value,
                });

                if (error) throw error;

                navigateTo('/dashboard');
                loginFailed.value = false;
                loginSuccess.value = true;
            } catch (error) {
                console.error('Supabase login failed:', error.message);
                loginSuccess.value = false;
                loginFailed.value = true;
            }
        };

        return {
            email,
            password,
            loginFailed,
            loginSuccess,
            showPassword,
            handleSupabaseLogin,
        };
    },
};
</script>

<style scoped></style>
