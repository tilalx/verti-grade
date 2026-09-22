<template>
    <v-card class="stats-card surface-card" elevation="0">
        <div
            class="accent-bar"
            :style="{ background: resolvedAccentColor }"
        ></div>
        <v-card-text class="card-body">
            <div class="d-flex align-center justify-space-between mb-3">
                <div class="icon-badge" :style="{ background: resolvedIconBg }">
                    <v-icon
                        :icon="icon ?? 'mdi-chart-bar'"
                        :color="resolvedIconFg"
                        size="18"
                    />
                </div>
                <div
                    class="sparkline"
                    v-if="!loading && normalizedSparkline.length"
                >
                    <span
                        v-for="(v, i) in normalizedSparkline"
                        :key="i"
                        class="spark-bar"
                        :style="{
                            height: v + '%',
                            background: resolvedAccentColor,
                        }"
                    />
                </div>
            </div>

            <div class="card-label">{{ title }}</div>

            <div v-if="loading" class="mt-1">
                <v-skeleton-loader type="text" width="80" />
            </div>
            <template v-else>
                <div class="card-value" data-testid="stats-card-value">
                    {{ formattedValue }}
                </div>
                <div class="card-footer mt-1">
                    <template v-if="delta !== null && delta !== undefined">
                        <span :class="delta >= 0 ? 'delta-up' : 'delta-down'">
                            {{ delta >= 0 ? '↑' : '↓' }} {{ Math.abs(delta) }}
                        </span>
                        <span class="footer-sub">vs last month</span>
                    </template>
                    <span v-else-if="subtitle" class="footer-sub">{{
                        subtitle
                    }}</span>
                </div>
            </template>
        </v-card-text>
    </v-card>
</template>

<script setup>
const props = defineProps({
    title: {
        type: String,
        required: true,
    },
    value: {
        type: [String, Number],
        required: true,
    },
    icon: {
        type: String,
        default: undefined,
    },
    subtitle: {
        type: String,
        default: undefined,
    },
    loading: {
        type: Boolean,
        default: false,
    },
    format: {
        type: Function,
        default: (value) => `${value}`,
    },
    delta: {
        type: Number,
        default: null,
    },
    sparkline: {
        type: Array,
        default: () => [],
    },
    accentColor: {
        type: String,
        default: '#378ADD',
    },
    iconBg: {
        type: String,
        default: undefined,
    },
    iconFg: {
        type: String,
        default: undefined,
    },
})

const resolvedAccentColor = computed(() => props.accentColor)

const resolvedIconBg = computed(() => {
    if (props.iconBg) return props.iconBg
    return props.accentColor + '1F'
})

const resolvedIconFg = computed(() => props.iconFg ?? props.accentColor)

const formattedValue = computed(() => props.format(props.value))

const normalizedSparkline = computed(() => {
    if (!props.sparkline?.length) return []
    const max = Math.max(...props.sparkline)
    if (max === 0) return props.sparkline.map(() => 20)
    return props.sparkline.map((v) => Math.max(12, Math.round((v / max) * 100)))
})
</script>

<style scoped>
.stats-card {
    height: 100%;
    position: relative;
    overflow: hidden;
    transition:
        box-shadow 0.18s ease,
        transform 0.18s ease;
}

.stats-card:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.09) !important;
    transform: translateY(-1px);
}

.accent-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    border-radius: 14px 14px 0 0;
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
    flex-shrink: 0;
}

.sparkline {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    opacity: 0.4;
    height: 28px;
}

.spark-bar {
    width: 4px;
    border-radius: 2px;
    display: block;
    min-height: 4px;
    transition: height 0.3s ease;
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
    letter-spacing: -0.5px;
}

.card-footer {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    min-height: 18px;
}

.delta-up {
    color: #1d9e75;
    font-weight: 600;
    font-size: 11px;
}

.delta-down {
    color: #d85a30;
    font-weight: 600;
    font-size: 11px;
}

.footer-sub {
    color: rgba(var(--v-theme-on-surface), 0.4);
    font-size: 11px;
}
</style>
