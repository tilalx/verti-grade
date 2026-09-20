<template>
    <v-container>
        <LayoutEmptyState
            icon="mdi-map-marker-question-outline"
            eyebrow="404"
            :title="$t('errors.notFound.title')"
            :hint="$t('errors.notFound.subtitle')"
        />
    </v-container>
</template>

<script setup>
defineOptions({ name: 'NotFoundView' })

const { t } = useI18n()

useHead({
    title: t('page.title.notFound'),
})

// Catch-all route, so unknown paths render inside the normal layout instead
// of Nuxt's built-in error page. Also serves /404, which route.vue targets.
if (import.meta.server) setResponseStatus(useRequestEvent(), 404)
</script>

<style scoped></style>
