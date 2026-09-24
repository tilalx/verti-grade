<template>
    <v-card class="stats-card surface-card" elevation="0">
        <div class="accent-bar" :class="`bg-${color}`"></div>
        <v-card-text class="card-body">
            <div class="d-flex align-center justify-space-between mb-3">
                <div class="icon-badge" :style="{ background: tint }">
                    <v-icon :icon="icon" :color="color" size="18" />
                </div>
                <v-chip
                    v-if="delta !== null && !loading"
                    size="x-small"
                    variant="tonal"
                    :color="
                        delta === 0
                            ? undefined
                            : delta > 0
                              ? 'success'
                              : 'error'
                    "
                    :prepend-icon="
                        delta === 0
                            ? 'mdi-minus'
                            : delta > 0
                              ? 'mdi-arrow-up'
                              : 'mdi-arrow-down'
                    "
                    data-testid="stats-card-trend"
                >
                    {{ formatDelta(delta) }}
                </v-chip>
            </div>

            <div class="card-label">{{ title }}</div>

            <div v-if="loading" class="mt-1">
                <v-skeleton-loader type="text" width="80" />
            </div>
            <template v-else>
                <div class="card-value" data-testid="stats-card-value">
                    {{ value === null ? '—' : format(value) }}
                </div>
                <v-progress-linear
                    v-if="meter !== null"
                    :model-value="meter * 100"
                    :color="color"
                    rounded
                    height="6"
                    class="my-2"
                    data-testid="stats-card-meter"
                />
                <svg
                    v-else-if="sparkPoints"
                    class="sparkline my-1"
                    :class="`text-${color}`"
                    viewBox="0 0 100 24"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    data-testid="stats-card-spark"
                >
                    <polyline
                        :points="sparkPoints"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linejoin="round"
                        vector-effect="non-scaling-stroke"
                    />
                </svg>
                <div class="card-footer">
                    <span v-if="subtitle" class="footer-sub">{{
                        subtitle
                    }}</span>
                </div>
            </template>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        title: string
        value: number | null
        previous?: number | null
        icon: string
        color: string
        subtitle?: string
        loading?: boolean
        format?: (value: number) => string
        spark?: number[]
        meter?: number | null
    }>(),
    {
        previous: null,
        spark: () => [],
        meter: null,
        loading: false,
        format: (value: number) => `${value}`,
    },
)

const tint = computed(() => `rgba(var(--v-theme-${props.color}), 0.12)`)
const delta = computed(() =>
    props.previous === null || props.value === null
        ? null
        : Number((props.value - props.previous).toFixed(2)),
)

const sparkPoints = computed(() => {
    if (props.spark.length < 2) return ''
    const max = Math.max(...props.spark, 1)
    const step = 100 / (props.spark.length - 1)
    return props.spark
        .map((value, index) => `${index * step},${22 - (value / max) * 20}`)
        .join(' ')
})

function formatDelta(value: number) {
    return `${value > 0 ? '+' : ''}${props.format(value)}`
}
</script>

<style scoped>
.stats-card {
    height: 100%;
    position: relative;
    overflow: hidden;
}

.accent-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
}

.card-body {
    padding: 18px 18px 16px !important;
}

.icon-badge {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.card-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: rgba(var(--v-theme-on-surface), 0.5);
    margin-bottom: 4px;
}

.card-value {
    font-size: 30px;
    font-weight: 600;
    line-height: 1.1;
    color: rgb(var(--v-theme-on-surface));
}

.sparkline {
    display: block;
    width: 100%;
    height: 24px;
}

.card-footer {
    font-size: 11px;
    min-height: 18px;
    color: rgba(var(--v-theme-on-surface), 0.4);
}
</style>
