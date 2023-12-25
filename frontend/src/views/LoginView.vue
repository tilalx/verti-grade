<template>
    <div class="login-container">
        <h1>Login</h1>
        <form @submit.prevent="handleLogin">
            <label for="email">Email:</label>
            <input type="email" id="email" v-model="email" required>
            <br>
            <label for="password">Password:</label>
            <input type="password" id="password" v-model="password" required>
            <br>
            <button type="submit">Login</button>
        </form>
    </div>
</template>

<script>
import { loginUser } from '@/services/auth';

export default {
    data() {
        return {
            email: '',
            password: '',
        };
    },
    methods: {
        async handleLogin() {
            try {
                const token = await loginUser(this.email, this.password);
                // Save the user data to the Vuex store
                this.$store.commit('setToken', token);
                // Redirect the user to the Dashboard
                this.$router.push('/dashboard');             
            } catch (error) {
                console.error('Login failed:', error);
            }
        },
    },
};
</script>

<style scoped>
.login-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f8f8f8;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
    text-align: center;
    margin-bottom: 20px;
}

form {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

label {
    margin-bottom: 10px;
}

input {
    margin-bottom: 20px;
    padding: 10px;
    width: 100%;
    border: 1px solid #ccc;
    border-radius: 4px;
}

button {
    padding: 10px 20px;
    background-color: #007bff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
</style>
