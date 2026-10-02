<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        icon?: string
        eyebrow?: string
        title: string
        hint?: string
        card?: boolean
        variant?: 'empty' | 'error'
    }>(),
    { card: true, variant: 'empty' },
)

const isError = computed(() => props.variant === 'error')
const resolvedIcon = computed(
    () =>
        props.icon ??
        (isError.value ? 'i-lucide-circle-alert' : 'i-lucide-search-x'),
)
</script>

<template>
    <div
        class="empty-state py-12 text-center"
        :class="card ? 'rounded-lg border border-default bg-default' : ''"
        :role="isError ? 'alert' : undefined"
        data-testid="empty-state"
    >
        <UIcon
            :name="resolvedIcon"
            class="empty-state__icon mb-4 size-[56px]"
            data-testid="empty-state-icon"
            :class="{ 'empty-state__icon--error': isError }"
        />
        <div v-if="eyebrow" class="text-[2rem] leading-10 font-bold mb-1">
            {{ eyebrow }}
        </div>
        <div class="text-[1.375rem] leading-7 text-muted">{{ title }}</div>
        <div v-if="hint" class="text-sm text-muted mt-1">
            {{ hint }}
        </div>
        <div
            v-if="$slots.actions"
            class="flex flex-wrap justify-center gap-2 mt-4"
        >
            <slot name="actions" />
        </div>
    </div>
</template>

<style scoped>
.empty-state__icon {
    color: color-mix(in oklab, var(--ui-text-highlighted) 26%, transparent);
}

.empty-state__icon--error {
    color: var(--ui-error);
}
</style>
