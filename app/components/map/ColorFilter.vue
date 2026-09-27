<script setup lang="ts">
import { translatedColorName } from '~/utils/colorName'

const selected = defineModel<string | null>({ default: null })
defineProps<{ colors: string[] }>()

const { t } = useI18n()

function toggle(color: string) {
    selected.value = selected.value === color ? null : color
}
</script>

<template>
    <div
        v-if="colors.length"
        class="color-filter"
        role="group"
        :aria-label="$t('climbing.color')"
    >
        <button
            v-for="color in colors"
            :key="color"
            type="button"
            class="color-filter__swatch"
            :class="{ 'color-filter__swatch--active': selected === color }"
            :style="{ background: color }"
            :aria-label="translatedColorName(t, color) || color"
            :title="translatedColorName(t, color) || color"
            :aria-pressed="selected === color"
            :data-color="color"
            data-testid="color-filter-swatch"
            @click="toggle(color)"
        />
    </div>
</template>

<style scoped>
.color-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.color-filter__swatch {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid rgba(var(--v-border-color), 0.3);
    cursor: pointer;
}

.color-filter__swatch--active {
    outline: 3px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
}

@media (pointer: coarse) {
    .color-filter__swatch {
        width: 36px;
        height: 36px;
    }
}
</style>
