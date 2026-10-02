<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        variant?: 'list' | 'cards' | 'page'
        count?: number
    }>(),
    { variant: 'list' },
)

const skeletonCount = computed(
    () => props.count ?? (props.variant === 'cards' ? 6 : 3),
)
</script>

<template>
    <div aria-busy="true" aria-live="polite" data-testid="loading-state">
        <template v-if="variant === 'page'">
            <USkeleton class="h-[180px] w-full" />
            <div class="px-4 pt-4">
                <USkeleton class="mb-3 h-7 w-1/2" />
                <USkeleton class="mb-2 h-4 w-full" />
                <USkeleton class="mb-6 h-4 w-4/5" />
                <div
                    v-for="index in skeletonCount"
                    :key="index"
                    class="skeleton-row mb-3 flex items-center gap-4"
                >
                    <USkeleton class="size-10 shrink-0 rounded-full" />
                    <div class="flex-1 space-y-2">
                        <USkeleton class="h-4 w-2/3" />
                        <USkeleton class="h-3 w-1/2" />
                    </div>
                </div>
            </div>
        </template>
        <div
            v-else-if="variant === 'cards'"
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
            <div
                v-for="index in skeletonCount"
                :key="index"
                class="skeleton-row rounded-lg border border-default p-4"
            >
                <div class="mb-4 flex items-center gap-4">
                    <USkeleton class="size-10 shrink-0 rounded-full" />
                    <USkeleton class="h-4 flex-1" />
                </div>
                <USkeleton class="h-24 w-full" />
            </div>
        </div>
        <template v-else>
            <div
                v-for="index in skeletonCount"
                :key="index"
                class="skeleton-row mb-3 flex items-center gap-4 rounded-lg p-4"
            >
                <USkeleton class="size-10 shrink-0 rounded-full" />
                <div class="flex-1 space-y-2">
                    <USkeleton class="h-4 w-2/3" />
                    <USkeleton class="h-3 w-1/2" />
                </div>
            </div>
        </template>
    </div>
</template>
