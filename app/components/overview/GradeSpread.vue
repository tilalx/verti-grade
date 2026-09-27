<template>
    <figure
        v-if="bars.length"
        class="grade-spread"
        data-testid="overview-grades"
    >
        <figcaption class="grade-spread__title">{{ title }}</figcaption>
        <div class="grade-spread__bars" role="list">
            <v-tooltip
                v-for="bar in bars"
                :key="bar.grade"
                :text="`${bar.grade}: ${$t('overview.routesCount', { n: bar.count })}`"
                location="top"
            >
                <template #activator="{ props: tooltipProps }">
                    <div
                        v-bind="tooltipProps"
                        class="grade-spread__bar"
                        role="listitem"
                        tabindex="0"
                        :aria-label="`${bar.grade}: ${bar.count}`"
                        data-testid="overview-grade-bar"
                    >
                        <span class="grade-spread__count">{{
                            bar.count || ''
                        }}</span>
                        <span
                            class="grade-spread__fill"
                            :style="{ height: `${(bar.count / max) * 100}%` }"
                        />
                        <span class="grade-spread__label">{{ bar.grade }}</span>
                    </div>
                </template>
            </v-tooltip>
        </div>
    </figure>
</template>

<script setup lang="ts">
const props = defineProps<{
    title: string
    bars: { grade: string; count: number }[]
}>()

const max = computed(() => Math.max(1, ...props.bars.map((bar) => bar.count)))
</script>

<style scoped>
.grade-spread {
    margin: 0;
}

.grade-spread__title {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 8px;
}

.grade-spread__bars {
    display: flex;
    align-items: stretch;
    gap: 4px;
    height: 140px;
}

.grade-spread__bar {
    display: grid;
    grid-template-rows: auto 1fr auto;
    align-items: end;
    flex: 1;
    min-width: 0;
    text-align: center;
    border-radius: 4px;
    cursor: default;
    container-type: inline-size;
    transition: opacity 0.15s ease;
}

@media (hover: hover) {
    .grade-spread__bars:hover .grade-spread__bar:not(:hover) {
        opacity: 0.45;
    }
}

.grade-spread__bar:hover .grade-spread__label,
.grade-spread__bar:focus-visible .grade-spread__label {
    font-weight: 700;
}

.grade-spread__bar:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
}

.grade-spread__count {
    font-size: 0.7rem;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.grade-spread__fill {
    display: block;
    min-height: 2px;
    border-radius: 4px 4px 0 0;
    background: rgb(var(--v-theme-primary));
    align-self: end;
}

.grade-spread__label {
    margin-top: 4px;
    font-size: 0.7rem;
    white-space: nowrap;
    overflow: hidden;
}

@container (max-width: 22px) {
    .grade-spread__label {
        justify-self: center;
        writing-mode: vertical-rl;
        transform: rotate(180deg);
    }
}
</style>
