<template>
    <VApp class="fontbody">
        <NuxtLoadingIndicator color="rgb(var(--v-theme-primary))" :height="3" />
        <NuxtAnnouncer />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </VApp>
</template>

<script setup lang="ts">
const { locale } = useI18n()
const theme = useTheme()
useHead({
    htmlAttrs: { lang: locale },
    meta: [
        {
            name: 'theme-color',
            content: () => theme.current.value.colors.background,
        },
    ],
})
</script>
