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
        value: string | number
        icon?: string
        subtitle?: string
        loading?: boolean
        format?: (value: number) => string
        accentColor?: string
        iconBg?: string
        iconFg?: string
    }>(),
    {
        loading: false,
        format: (value: number) => `${value}`,
        accentColor: '#378ADD',
    },
)

const resolvedAccentColor = computed(() => props.accentColor)
const resolvedIconBg = computed(() => props.iconBg ?? `${props.accentColor}1F`)
const resolvedIconFg = computed(() => props.iconFg ?? props.accentColor)
const formattedValue = computed(() => props.format(Number(props.value)))
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

.footer-sub {
    color: rgba(var(--v-theme-on-surface), 0.4);
    font-size: 11px;
}
</style>
