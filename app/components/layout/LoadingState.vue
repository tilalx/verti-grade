<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        variant?: 'list' | 'cards' | 'page'
        count?: number
        type?: string
    }>(),
    { variant: 'list' },
)

const skeletonCount = computed(
    () => props.count ?? (props.variant === 'cards' ? 6 : 3),
)
const skeletonType = computed(
    () =>
        props.type ??
        (props.variant === 'cards'
            ? 'card-avatar'
            : 'list-item-avatar-two-line'),
)
</script>

<template>
    <div aria-busy="true" aria-live="polite" data-testid="loading-state">
        <template v-if="variant === 'page'">
            <v-skeleton-loader type="image" height="180" />
            <div class="px-4 pt-4">
                <v-skeleton-loader type="heading" class="mb-3" />
                <v-skeleton-loader type="text" class="mb-2" />
                <v-skeleton-loader type="text" class="mb-6" />
                <v-skeleton-loader
                    v-for="index in skeletonCount"
                    :key="index"
                    type="list-item-avatar-two-line"
                    class="mb-3"
                />
            </div>
        </template>
        <v-row v-else-if="variant === 'cards'">
            <v-col
                v-for="index in skeletonCount"
                :key="index"
                cols="12"
                sm="6"
                lg="4"
            >
                <v-skeleton-loader :type="skeletonType" rounded="lg" />
            </v-col>
        </v-row>
        <template v-else>
            <v-skeleton-loader
                v-for="index in skeletonCount"
                :key="index"
                :type="skeletonType"
                rounded="lg"
                class="mb-3"
            />
        </template>
    </div>
</template>
