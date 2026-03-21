<template>
    <VApp class="fontbody">
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </VApp>
</template>

<script setup>
const { locale } = useI18n()
useHead({ htmlAttrs: { lang: locale } })
</script>