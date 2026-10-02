<template>
    <div
        class="map-chips"
        role="toolbar"
        :aria-label="$t('map.filters')"
        data-testid="map-chips"
    >
        <slot />
        <UButton
            v-for="option in typeOptions"
            :key="option.value"
            class="map-chip rounded-full shadow-[0_1px_3px_rgb(0_0_0/0.2)]"
            :color="type === option.value ? 'primary' : 'neutral'"
            :variant="type === option.value ? 'solid' : 'outline'"
            :aria-pressed="type === option.value"
            :data-testid="`map-type-${option.value}`"
            @click="type = type === option.value ? '' : option.value"
        >
            {{ option.label }}
        </UButton>
        <slot name="after-type" />
        <UPopover v-if="grades.length" :content="{ align: 'start' }">
            <UButton
                class="map-chip rounded-full shadow-[0_1px_3px_rgb(0_0_0/0.2)]"
                :color="grade ? 'primary' : 'neutral'"
                :variant="grade ? 'solid' : 'outline'"
                trailing-icon="i-lucide-chevron-down"
                data-testid="map-filter-grade"
            >
                {{ gradeText }}
            </UButton>
            <template #content="{ close }">
                <div
                    class="flex max-h-[360px] min-w-[160px] flex-col gap-0.5 overflow-y-auto p-1"
                    role="listbox"
                    data-testid="map-grade-menu"
                >
                    <button
                        type="button"
                        role="option"
                        class="map-chips__option"
                        :class="{ 'map-chips__option--active': !grade }"
                        :aria-selected="!grade"
                        @click="selectGrade(null, close)"
                    >
                        {{ $t('filter.all') }}
                    </button>
                    <button
                        v-for="item in grades"
                        :key="String(item.value)"
                        type="button"
                        role="option"
                        class="map-chips__option"
                        :class="{
                            'map-chips__option--active': grade === item.value,
                        }"
                        :aria-selected="grade === item.value"
                        data-testid="map-grade-option"
                        @click="selectGrade(item.value, close)"
                    >
                        {{ item.title }}
                    </button>
                </div>
            </template>
        </UPopover>
        <UPopover v-if="colors.length" :content="{ align: 'start' }">
            <UButton
                class="map-chip rounded-full shadow-[0_1px_3px_rgb(0_0_0/0.2)]"
                :color="color ? 'primary' : 'neutral'"
                :variant="color ? 'solid' : 'outline'"
                trailing-icon="i-lucide-chevron-down"
                data-testid="map-filter-color-chip"
            >
                <span
                    v-if="color"
                    class="map-chips__swatch"
                    :style="{ background: color }"
                />
                {{ $t('climbing.color') }}
            </UButton>
            <template #content>
                <div class="max-w-[300px] p-3">
                    <MapColorFilter
                        v-model="color"
                        :colors="colors"
                        data-testid="map-filter-color"
                    />
                </div>
            </template>
        </UPopover>
        <UButton
            v-if="activeCount"
            class="map-chip rounded-full shadow-[0_1px_3px_rgb(0_0_0/0.2)]"
            color="neutral"
            variant="outline"
            icon="i-lucide-x"
            data-testid="map-filter-clear"
            @click="emit('clear')"
        >
            {{ $t('map.clearFilters') }}
        </UButton>
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

function selectGrade(value: string | null, close: () => void) {
    grade.value = value
    close()
}

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

.map-chip,
.map-chips :slotted(.map-chip) {
    flex-shrink: 0;
}

.map-chips__option {
    padding: 6px 12px;
    border-radius: 6px;
    text-align: left;
    font-size: 0.875rem;
}

.map-chips__option:hover {
    background: color-mix(in oklab, var(--ui-text-highlighted) 6%, transparent);
}

.map-chips__option--active {
    color: var(--ui-primary);
    background: color-mix(in oklab, var(--ui-primary) 12%, transparent);
}

.map-chips__swatch {
    display: inline-block;
    width: 14px;
    height: 14px;
    margin-right: 6px;
    border-radius: 50%;
    border: 1px solid
        color-mix(in oklab, var(--ui-text-highlighted) 40%, transparent);
}
</style>
