<template>
    <div class="map-canvas">
        <svg
            :ref="bindSvg"
            v-bind="$attrs"
            class="map-canvas__svg"
            :class="{ 'map-canvas__svg--panning': panZoom.isPanning.value }"
            :style="panZoom.isPanning.value ? undefined : { cursor }"
            :viewBox="panZoom.viewBoxAttr.value"
            preserveAspectRatio="xMidYMid meet"
            tabindex="0"
            :role="role"
            :aria-label="label"
        >
            <slot />
        </svg>
        <slot name="overlay" />
        <div class="map-canvas__controls">
            <v-btn
                icon="mdi-plus"
                size="small"
                variant="elevated"
                :aria-label="$t('map.zoomIn')"
                data-testid="map-zoom-in"
                @click="panZoom.zoomBy(1.5)"
            />
            <v-btn
                icon="mdi-minus"
                size="small"
                variant="elevated"
                :aria-label="$t('map.zoomOut')"
                data-testid="map-zoom-out"
                @click="panZoom.zoomBy(1 / 1.5)"
            />
            <v-btn
                icon="mdi-fit-to-page-outline"
                size="small"
                variant="elevated"
                :aria-label="$t('map.fit')"
                data-testid="map-fit"
                @click="panZoom.fitAll(true)"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { SvgPanZoom } from '~/composables/useSvgPanZoom'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
    defineProps<{
        panZoom: SvgPanZoom
        label: string
        role?: 'group' | 'application'
        cursor?: string
    }>(),
    { role: 'group', cursor: undefined },
)

function bindSvg(element: unknown) {
    props.panZoom.svgRef.value = element as SVGSVGElement | null
}
</script>

<style scoped>
.map-canvas {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: rgba(var(--v-theme-on-surface), 0.03);
}

.map-canvas__svg {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    outline: none;
    cursor: grab;
}

.map-canvas__svg:focus-visible {
    box-shadow: inset 0 0 0 2px rgb(var(--v-theme-primary));
}

.map-canvas__svg--panning {
    cursor: grabbing;
}

.map-canvas__controls {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

@media (pointer: coarse) {
    .map-canvas__controls {
        gap: 4px;
        opacity: 0.92;
    }
}
</style>
