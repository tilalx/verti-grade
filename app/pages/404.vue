<template>
    <v-container fluid>
        <v-row justify="center" align="center" class="text-center">
            <v-col cols="12">
                <v-card class="pa-4">
                    <v-card-title class="display-1">404</v-card-title>
                    <v-card-subtitle class="headline">{{
                        $t('errors.notFound.title')
                    }}</v-card-subtitle>
                    <v-card-text class="subheading-1">{{
                        $t('errors.notFound.subtitle')
                    }}</v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
defineOptions({ name: 'NotFoundView' })

const { t } = useI18n()

useHead({
    title: t('page.title.notFound'),
})
</script>

<style scoped></style>
