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
    <div v-if="ratings?.length" class="my-4 rounded-lg border bg-default">
        <div class="px-4 pt-3 pb-1 text-base font-semibold">
            {{ $t('importRoutes.ratingsFor', { name }) }}
        </div>
        <ul class="py-1">
            <li v-for="(rating, i) in ratings" :key="i" class="px-4 py-1.5">
                <div class="text-sm">
                    <strong>{{ $t('importRoutes.ratingLabel') }}:</strong>
                    {{ rating.rating }}/5,
                    <strong>{{ $t('importRoutes.difficultyLabel') }}:</strong>
                    {{ rating.grade ?? rating.difficulty }}
                </div>
                <div class="text-sm text-muted">
                    {{ rating.comment || $t('importRoutes.noComment') }}
                </div>
            </li>
        </ul>
    </div>
    <p v-else class="text-center p-4 text-sm text-muted">
        {{ $t('importRoutes.noRatings') }}
    </p>
</template>
