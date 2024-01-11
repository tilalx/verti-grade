<template>
    <v-container class="login-container">
        <v-row justify="center" align="center" style="height: 100vh;">
            <v-col cols="12" sm="12" md="4">
                <v-card>
                    <v-card>
                        
                        <v-card-title class="text-center">
                            <h1>Login</h1>
                        </v-card-title>
                        <v-divider></v-divider>
                        <v-card-text>
                            <v-form @submit.prevent="handleLogin">
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
                                <v-btn type="submit" color="primary" class="text-right">Login</v-btn>
                            </v-form>
                        </v-card-text>
                    </v-card>
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
import { loginUser } from '@/services/auth';

export default {
    data() {
        return {
            email: '',
            password: '',
            loginFailed: false,
            loginSuccess: false,
            showPassword: false,
        };
    },
    methods: {
        async handleLogin() {
            try {
                this.loginFailed = false;
                const token = await loginUser(this.email, this.password);
                // Save the user data to the Vuex store
                this.$store.commit('setToken', token);
                // Redirect the user to the Dashboard
                this.$router.push('/dashboard');
                this.loginSuccess = true;
            } catch (error) {
                console.error('Login failed:', error);
                this.loginFailed = true;
            }
        },
    },
};
</script>

<style scoped></style>
