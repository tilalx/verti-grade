<template></template>

<script setup>
useHead({
    title: 'Settings - Verti-Grade',
    meta: [
        {
            name: 'description',
            content: 'Settings for Verti-Grade',
        },
    ],
})

definePageMeta({
    authRequired: true,
    middleware: ['auth'],
})
</script>

<style scoped></style>
