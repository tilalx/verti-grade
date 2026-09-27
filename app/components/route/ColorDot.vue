<template>
    <span
        class="route-color-dot"
        data-testid="route-color-dot"
        :style="{
            width: `${size}px`,
            height: `${size}px`,
            background: routeDotColor(color),
        }"
        :role="label ? 'img' : undefined"
        :aria-label="label || undefined"
        :data-ticked="ticked || undefined"
    >
        <span
            v-if="ticked"
            class="route-color-dot__tick mdi mdi-check-bold"
            aria-hidden="true"
        />
    </span>
</template>

<script setup lang="ts">
import { routeDotColor } from '~/utils/color'
import { translatedColorName } from '~/utils/colorName'

const props = withDefaults(
    defineProps<{
        color?: string | null
        ticked?: boolean
        size?: number
    }>(),
    { color: null, ticked: false, size: 32 },
)

const { t } = useI18n()
const label = computed(() =>
    [translatedColorName(t, props.color), props.ticked && t('ticks.sent')]
        .filter(Boolean)
        .join(', '),
)
</script>

<style scoped>
.route-color-dot {
    position: relative;
    display: inline-block;
    flex-shrink: 0;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px rgba(var(--v-theme-on-surface), 0.24);
}

.route-color-dot__tick {
    position: absolute;
    right: -4px;
    bottom: -4px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    font-size: 11px;
    background: rgb(var(--v-theme-success));
    color: rgb(var(--v-theme-on-success));
    box-shadow: 0 0 0 2px rgb(var(--v-theme-surface));
}
</style>
