<script setup lang="ts">
const props = defineProps<{
    label: string
    value: string | number
    icon?: string
    iconColor?: string
    color?: string
}>()

const iconClass = computed(() =>
    props.iconColor === 'yellow-darken-2'
        ? 'text-amber-500'
        : props.iconColor && `text-${props.iconColor}`,
)
</script>

<template>
    <div class="text-center">
        <div class="flex items-center justify-center gap-1">
            <UIcon
                v-if="icon"
                :name="icon"
                class="size-[20px]"
                :class="iconClass"
            />
            <span
                class="text-[1.375rem] leading-7 font-bold"
                :class="color ? `text-${color}` : undefined"
                data-testid="stat-tile-value"
                >{{ value }}</span
            >
        </div>
        <div class="text-xs text-muted">{{ label }}</div>
    </div>
</template>
