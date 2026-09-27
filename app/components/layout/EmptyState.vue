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
        (isError.value
            ? 'mdi-alert-circle-outline'
            : 'mdi-magnify-remove-outline'),
)
</script>

<template>
    <div
        class="empty-state py-12 text-center"
        :class="card ? 'rounded-lg border bg-surface' : ''"
        :role="isError ? 'alert' : undefined"
        data-testid="empty-state"
    >
        <v-icon
            :icon="resolvedIcon"
            size="56"
            class="empty-state__icon mb-4"
            :class="{ 'empty-state__icon--error': isError }"
        />
        <div v-if="eyebrow" class="text-headline-large font-weight-bold mb-1">
            {{ eyebrow }}
        </div>
        <div class="text-title-large text-medium-emphasis">{{ title }}</div>
        <div v-if="hint" class="text-body-medium text-medium-emphasis mt-1">
            {{ hint }}
        </div>
        <div
            v-if="$slots.actions"
            class="d-flex flex-wrap justify-center ga-2 mt-4"
        >
            <slot name="actions" />
        </div>
    </div>
</template>

<style scoped>
.empty-state__icon {
    color: rgba(var(--v-theme-on-surface), 0.26);
}

.empty-state__icon--error {
    color: rgb(var(--v-theme-error));
}
</style>
