<template>
    <v-btn @click="logout">
        <v-icon class="mdi mdi-logout"></v-icon>
    </v-btn>
</template>

<script>
export default {
    methods: {
        logout() {
            this.$store.dispatch('resetStore');
            this.$router.push('/');
        }
    }
}
</script>