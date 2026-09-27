<script setup lang="ts">
defineProps<{
    label: string
    value: string | number
    icon?: string
    iconColor?: string
    color?: string
}>()
</script>

<template>
    <div class="text-center">
        <div class="d-flex align-center justify-center ga-1">
            <v-icon v-if="icon" :icon="icon" :color="iconColor" size="20" />
            <span
                class="text-title-large font-weight-bold"
                :class="color ? `text-${color}` : undefined"
                data-testid="stat-tile-value"
                >{{ value }}</span
            >
        </div>
        <div class="text-body-small text-medium-emphasis">{{ label }}</div>
    </div>
</template>
