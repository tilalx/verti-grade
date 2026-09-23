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

<script setup lang="ts">
defineOptions({ name: 'NotFoundView' })

const { t } = useI18n()

useHead({
    title: t('page.title.notFound'),
})

const requestEvent = useRequestEvent()
if (requestEvent) setResponseStatus(requestEvent, 404)
</script>

<style scoped></style>
