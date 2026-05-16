<template>
    <v-main>
        <NuxtPage />
    </v-main>
    <GlobalSnackbar />
</template>

<script setup>
await useAsyncData('tenant', () => $fetch('/api/tenant'))
</script>
