<template>
    <div class="surface-card w-full" :data-testid="testid">
        <div class="section-header">
            <div class="section-icon" :style="{ background: tint }">
                <UIcon
                    :name="icon"
                    class="size-[16px]"
                    :style="{ color: accent }"
                />
            </div>
            <div class="section-heading">
                <div class="section-title">{{ title }}</div>
                <div v-if="subtitle" class="section-subtitle">
                    {{ subtitle }}
                </div>
            </div>
            <div class="flex-1" />
            <slot name="actions" />
        </div>
        <USeparator />
        <div :class="flush ? 'p-0' : 'p-4'">
            <div v-if="loading && flush" class="flex flex-col gap-4 px-4 py-2">
                <div v-for="n in 3" :key="n" class="flex flex-col gap-2">
                    <USkeleton class="h-4 w-3/4" />
                    <USkeleton class="h-3 w-1/2" />
                </div>
            </div>
            <USkeleton v-else-if="loading" class="section-skeleton w-full" />
            <LayoutEmptyState
                v-else-if="empty"
                :icon="emptyIcon"
                :card="false"
                :title="emptyText ?? $t('analytics.emptySection')"
            />
            <slot v-else />
        </div>
    </div>
</template>

<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        title: string
        subtitle?: string
        icon: string
        color?: string
        testid?: string
        loading?: boolean
        empty?: boolean
        emptyIcon?: string
        emptyText?: string
        flush?: boolean
    }>(),
    {
        color: 'primary',
        emptyIcon: 'i-lucide-chart-column',
    },
)

const accent = computed(() => `var(--ui-${props.color})`)
const tint = computed(
    () => `color-mix(in oklab, ${accent.value} 12%, transparent)`,
)
</script>

<style scoped>
.section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    min-height: unset;
}

.section-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.section-heading {
    min-width: 0;
}

.section-subtitle {
    font-size: 0.75rem;
    font-weight: 400;
    line-height: 1.3;
    white-space: normal;
    color: color-mix(in oklab, var(--ui-text-highlighted) 55%, transparent);
}

.section-title {
    font-size: 0.875rem;
    font-weight: 600;
    white-space: normal;
}

.section-skeleton {
    height: 300px;
}
</style>
