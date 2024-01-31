<template>
    <v-btn @click="logout">
        <v-icon class="mdi mdi-logout"></v-icon>
    </v-btn>
</template>

<script>
import { defineComponent } from 'vue';
import { useMainStore } from '@/stores/main';

export default defineComponent({
    methods: {
        logout() {
            const store = useMainStore();
            store.resetStore();
            navigateTo('/');
        },
    },
});
</script>