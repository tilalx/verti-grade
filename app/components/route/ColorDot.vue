<template>
    <v-badge
        :model-value="ticked"
        color="success"
        icon="mdi-check-bold"
        location="bottom end"
        bordered
        class="flex-shrink-0"
        data-testid="route-color-dot"
    >
        <v-avatar
            :color="color || 'grey'"
            :size="size"
            class="route-color-dot"
            :role="ticked ? 'img' : undefined"
            :aria-label="ticked ? $t('ticks.sent') : undefined"
            :data-ticked="ticked || undefined"
        />
    </v-badge>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        color?: string | null
        ticked?: boolean
        size?: number
    }>(),
    { color: null, ticked: false, size: 32 },
)
</script>

<style scoped>
.route-color-dot {
    box-shadow: inset 0 0 0 1px rgba(var(--v-theme-on-surface), 0.24);
}
</style>
