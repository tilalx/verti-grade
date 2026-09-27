<template>
    <VApp class="fontbody">
        <NuxtLoadingIndicator color="rgb(var(--v-theme-primary))" :height="3" />
        <NuxtAnnouncer />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
        <GlobalSnackbar />
    </VApp>
</template>

<script setup lang="ts">
const { locale } = useI18n()
useHead({ htmlAttrs: { lang: locale } })
useThemeColorMeta()
</script>
