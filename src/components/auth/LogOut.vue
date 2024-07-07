<template>
    <v-btn @click="logout">
        <v-icon class="mdi mdi-logout"></v-icon>
    </v-btn>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const pb = usePocketbase()

async function logout() {
    pb.authStore.clear()

    router.push('/login')
}
</script>
