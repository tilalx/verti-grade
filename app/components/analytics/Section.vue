<template>
    <v-card class="surface-card w-100" elevation="0" :data-testid="testid">
        <v-card-title class="section-header">
            <div class="section-icon" :style="{ background: tint }">
                <v-icon size="16" :color="color">{{ icon }}</v-icon>
            </div>
            <div class="section-heading">
                <div class="section-title">{{ title }}</div>
                <div v-if="subtitle" class="section-subtitle">
                    {{ subtitle }}
                </div>
            </div>
            <v-spacer />
            <slot name="actions" />
        </v-card-title>
        <v-divider />
        <v-card-text :class="{ 'pa-0': flush }">
            <v-skeleton-loader
                v-if="loading"
                :type="flush ? 'list-item-two-line@3' : 'image'"
                :class="flush ? 'px-4 py-2' : 'section-skeleton'"
            />
            <LayoutEmptyState
                v-else-if="empty"
                :icon="emptyIcon"
                :card="false"
                :title="emptyText ?? $t('analytics.emptySection')"
            />
            <slot v-else />
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        title: string
        subtitle?: string
        icon: string
        color?: string
        testid?: string
        loading?: boolean
        empty?: boolean
        emptyIcon?: string
        emptyText?: string
        flush?: boolean
    }>(),
    {
        color: 'primary',
        emptyIcon: 'mdi-chart-box-outline',
    },
)

const tint = computed(() => `rgba(var(--v-theme-${props.color}), 0.12)`)
</script>

<style scoped>
.section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    min-height: unset;
}

.section-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.section-heading {
    min-width: 0;
}

.section-subtitle {
    font-size: 0.75rem;
    font-weight: 400;
    line-height: 1.3;
    white-space: normal;
    color: rgba(var(--v-theme-on-surface), 0.55);
}

.section-title {
    font-size: 0.875rem;
    font-weight: 600;
    white-space: normal;
}

.section-skeleton {
    height: 300px;
}
</style>
