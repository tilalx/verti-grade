<script setup lang="ts">
withDefaults(
    defineProps<{
        icon?: string
        eyebrow?: string
        title: string
        hint?: string
        card?: boolean
    }>(),
    { icon: 'mdi-magnify-remove-outline', card: true },
)
</script>

<template>
    <div
        class="empty-state py-12 text-center"
        :class="card ? 'rounded-lg border bg-surface' : ''"
        data-testid="empty-state"
    >
        <v-icon :icon="icon" size="56" class="empty-state__icon mb-4" />
        <div v-if="eyebrow" class="text-headline-large font-weight-bold mb-1">
            {{ eyebrow }}
        </div>
        <div class="text-title-large text-medium-emphasis">{{ title }}</div>
        <div v-if="hint" class="text-body-medium text-medium-emphasis mt-1">
            {{ hint }}
        </div>
    </div>
</template>

<style scoped>
.empty-state__icon {
    color: rgba(var(--v-theme-on-surface), 0.26);
}
</style>
