<template>
    <div
        class="map-chips"
        role="toolbar"
        :aria-label="$t('map.filters')"
        data-testid="map-chips"
    >
        <slot />
        <v-chip
            v-for="option in typeOptions"
            :key="option.value"
            variant="flat"
            :color="type === option.value ? 'primary' : 'surface'"
            :aria-pressed="type === option.value"
            :data-testid="`map-type-${option.value}`"
            @click="type = type === option.value ? '' : option.value"
        >
            {{ option.label }}
        </v-chip>
        <slot name="after-type" />
        <v-menu v-if="grades.length">
            <template #activator="{ props: menuProps }">
                <v-chip
                    v-bind="menuProps"
                    variant="flat"
                    :color="grade ? 'primary' : 'surface'"
                    append-icon="mdi-menu-down"
                    data-testid="map-filter-grade"
                >
                    {{ gradeText }}
                </v-chip>
            </template>
            <v-list
                density="compact"
                max-height="360"
                data-testid="map-grade-menu"
            >
                <v-list-item
                    :title="$t('filter.all')"
                    :active="!grade"
                    @click="grade = null"
                />
                <v-list-item
                    v-for="item in grades"
                    :key="String(item.value)"
                    :title="item.title"
                    :active="grade === item.value"
                    data-testid="map-grade-option"
                    @click="grade = item.value"
                />
            </v-list>
        </v-menu>
        <v-menu v-if="colors.length">
            <template #activator="{ props: menuProps }">
                <v-chip
                    v-bind="menuProps"
                    variant="flat"
                    :color="color ? 'primary' : 'surface'"
                    append-icon="mdi-menu-down"
                    data-testid="map-filter-color-chip"
                >
                    <span
                        v-if="color"
                        class="map-chips__swatch"
                        :style="{ background: color }"
                    />
                    {{ $t('climbing.color') }}
                </v-chip>
            </template>
            <v-card class="pa-3" max-width="300">
                <MapColorFilter
                    v-model="color"
                    :colors="colors"
                    data-testid="map-filter-color"
                />
            </v-card>
        </v-menu>
        <v-chip
            v-if="activeCount"
            variant="flat"
            color="surface"
            prepend-icon="mdi-close"
            data-testid="map-filter-clear"
            @click="emit('clear')"
        >
            {{ $t('map.clearFilters') }}
        </v-chip>
    </div>
</template>

<script setup lang="ts">
export type RouteTypeFilter = '' | 'Boulder' | 'Route'

const grade = defineModel<string | null>('grade', { default: null })
const color = defineModel<string | null>('color', { default: null })
const type = defineModel<RouteTypeFilter>('type', { default: '' })

const props = defineProps<{
    grades: { title: string; value: string }[]
    colors: string[]
    gradeLabel: string
    activeCount: number
    typeFilter?: boolean
}>()

const emit = defineEmits<{ clear: [] }>()
const { t } = useI18n()

const typeOptions = computed(() =>
    props.typeFilter
        ? [
              { value: 'Boulder' as const, label: t('map.boulders') },
              { value: 'Route' as const, label: t('map.routes') },
          ]
        : [],
)

const gradeText = computed(
    () =>
        props.grades.find((item) => item.value === grade.value)?.title ??
        props.gradeLabel,
)
</script>

<style scoped>
.map-chips {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    padding: 2px 2px 6px;
}

.map-chips::-webkit-scrollbar {
    display: none;
}

.map-chips :deep(.v-chip) {
    flex-shrink: 0;
    box-shadow:
        0 1px 3px rgba(0, 0, 0, 0.2),
        0 0 0 1px rgba(var(--v-border-color), 0.12);
}

.map-chips__swatch {
    display: inline-block;
    width: 14px;
    height: 14px;
    margin-right: 6px;
    border-radius: 50%;
    border: 1px solid rgba(var(--v-border-color), 0.4);
}
</style>
