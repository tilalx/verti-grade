<template>
    <g class="floor-layer">
        <path
            v-for="(shape, index) in shapes"
            :key="index"
            :d="svgPath(shape.points)"
            class="floor-shape"
            :class="[
                `floor-shape--${shape.kind}`,
                { 'floor-shape--selected': index === selectedIndex },
            ]"
            :data-draggable="index === selectedIndex ? '' : undefined"
            data-testid="map-floor-shape"
            :data-kind="shape.kind"
            :role="selectable ? 'button' : undefined"
            :tabindex="selectable ? 0 : undefined"
            :aria-pressed="selectable ? index === selectedIndex : undefined"
            :aria-label="
                selectable ? $t(`mapEditor.kinds.${shape.kind}`) : undefined
            "
            @pointerdown="emit('shapePointerDown', index, $event)"
            @click="emit('shapeClick', index, $event)"
            @keydown.enter.prevent="
                selectable && emit('shapeClick', index, $event)
            "
            @keydown.space.prevent="
                selectable && emit('shapeClick', index, $event)
            "
        />
    </g>
</template>

<script setup lang="ts">
import type { MapShape } from '#shared/utils/mapGeometry'
import { svgPath } from '~/utils/mapSvg'

defineProps<{
    shapes: MapShape[]
    selectedIndex?: number | null
    selectable?: boolean
}>()

const emit = defineEmits<{
    shapePointerDown: [index: number, event: PointerEvent]
    shapeClick: [index: number, event: Event]
}>()
</script>

<style scoped>
.floor-shape {
    stroke: rgba(var(--v-theme-on-surface), 0.12);
    stroke-width: 1;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
}

.floor-shape--floor {
    fill: rgba(var(--v-theme-on-surface), 0.04);
}

.floor-shape--mat {
    fill: rgba(var(--v-theme-on-surface), 0.1);
}

.floor-shape--structure {
    fill: rgba(var(--v-theme-on-surface), 0.22);
}

.floor-shape:focus-visible {
    stroke: rgb(var(--v-theme-primary));
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
}

.floor-shape--selected {
    stroke: rgb(var(--v-theme-primary));
    stroke-width: 2;
    stroke-dasharray: 6 4;
}
</style>
