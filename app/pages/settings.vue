<template></template>

<script setup>

const { t } = useI18n()

useHead({
    title: t('page.title.settings'),
    meta: [
        {
            name: 'description',
            content: t('page.content.settings'),
        },
    ],
})

definePageMeta({
    authRequired: true,
    middleware: ['auth'],
})
</script>

<style scoped></style>
