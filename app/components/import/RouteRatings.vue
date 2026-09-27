<script setup lang="ts">
defineProps<{
    name: unknown
    ratings?: Array<{
        rating?: unknown
        comment?: unknown
        grade?: unknown
        difficulty?: unknown
    }>
}>()
</script>

<template>
    <v-card v-if="ratings?.length" class="my-4" border flat>
        <v-card-title class="text-body-large">
            {{ $t('importRoutes.ratingsFor', { name }) }}
        </v-card-title>
        <v-list density="compact">
            <v-list-item v-for="(rating, i) in ratings" :key="i">
                <v-list-item-title>
                    <strong>{{ $t('importRoutes.ratingLabel') }}:</strong>
                    {{ rating.rating }}/5,
                    <strong>{{ $t('importRoutes.difficultyLabel') }}:</strong>
                    {{ rating.grade ?? rating.difficulty }}
                </v-list-item-title>
                <v-list-item-subtitle>
                    {{ rating.comment || $t('importRoutes.noComment') }}
                </v-list-item-subtitle>
            </v-list-item>
        </v-list>
    </v-card>
    <p v-else class="text-center pa-4 text-body-medium text-medium-emphasis">
        {{ $t('importRoutes.noRatings') }}
    </p>
</template>
