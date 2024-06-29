<template>
    <v-btn @click="logout">
        <v-icon class="mdi mdi-logout"></v-icon>
    </v-btn>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
const supabase = useSupabaseClient();

async function logout() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        console.error('Logout failed:', error);
    } else {
        router.push('/login');
    }
}
</script>
