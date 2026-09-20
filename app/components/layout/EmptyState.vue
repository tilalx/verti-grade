<script setup lang="ts">
withDefaults(
    defineProps<{
        icon?: string
        /** Small label above the title (e.g. an HTTP status code). */
        eyebrow?: string
        title: string
        hint?: string
        /** Bordered card (list/table placeholders) vs bare text (inside cards). */
        card?: boolean
    }>(),
    { icon: 'mdi-magnify-remove-outline', card: true },
)
</script>

<template>
    <component
        :is="card ? 'v-card' : 'div'"
        v-bind="card ? { rounded: 'lg', border: true, flat: true } : {}"
        class="empty-state py-12 text-center"
        data-testid="empty-state"
    >
        <v-icon :icon="icon" size="56" class="empty-state__icon mb-4" />
        <div v-if="eyebrow" class="text-h4 font-weight-bold mb-1">
            {{ eyebrow }}
        </div>
        <div class="text-h6 text-medium-emphasis">{{ title }}</div>
        <div v-if="hint" class="text-body-2 text-medium-emphasis mt-1">
            {{ hint }}
        </div>
    </component>
</template>

<style scoped>
.empty-state__icon {
    color: rgba(var(--v-theme-on-surface), 0.26);
}
</style>
