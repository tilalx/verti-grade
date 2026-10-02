<template>
    <div data-testid="analytics-filters">
        <FilterBar
            :active-filter-count="activeFilterCount"
            @clear="clearFilters"
        >
            <template #search>
                <div class="grow xl:grow-0 min-w-0">
                    <div class="range-toggle flex gap-2 overflow-x-auto py-1">
                        <UButton
                            v-for="option in ANALYTICS_RANGES"
                            :key="option"
                            class="shrink-0 rounded-full"
                            :color="option === range ? 'primary' : 'neutral'"
                            :variant="option === range ? 'soft' : 'outline'"
                            :aria-pressed="option === range"
                            :data-testid="`analytics-range-${option}`"
                            @click="option !== range && selectRange(option)"
                        >
                            {{ $t(`analytics.filters.ranges.${option}`) }}
                        </UButton>
                    </div>
                </div>
            </template>

            <template #filters>
                <div class="contents">
                    <template v-if="range === 'custom'">
                        <UFormField
                            :label="$t('analytics.filters.from')"
                            class="w-full sm:w-auto"
                        >
                            <UInput
                                :model-value="query.from ?? ''"
                                type="date"
                                class="w-full"
                                data-testid="analytics-filter-from"
                                @update:model-value="
                                    emit('update', { from: String($event) })
                                "
                            />
                        </UFormField>
                        <UFormField
                            :label="$t('analytics.filters.to')"
                            class="w-full sm:w-auto"
                        >
                            <UInput
                                :model-value="query.to ?? ''"
                                type="date"
                                class="w-full"
                                data-testid="analytics-filter-to"
                                @update:model-value="
                                    emit('update', { to: String($event) })
                                "
                            />
                        </UFormField>
                    </template>
                    <USelect
                        :model-value="selectedLocations"
                        :items="locations"
                        label-key="name"
                        value-key="id"
                        multiple
                        :placeholder="$t('analytics.filters.locations')"
                        :aria-label="$t('analytics.filters.locations')"
                        class="w-full sm:w-56"
                        data-testid="analytics-filter-location"
                        @update:model-value="
                            emit('update', { location: $event.join(',') })
                        "
                    />
                    <USelect
                        :model-value="selectedTypes"
                        :items="typeOptions"
                        multiple
                        :placeholder="$t('analytics.filters.types')"
                        :aria-label="$t('analytics.filters.types')"
                        class="w-full sm:w-56"
                        data-testid="analytics-filter-type"
                        @update:model-value="
                            emit('update', { type: $event.join(',') })
                        "
                    />
                    <div class="flex items-center">
                        <UButton
                            class="rounded-full"
                            :color="includeArchived ? 'warning' : 'neutral'"
                            :variant="includeArchived ? 'soft' : 'outline'"
                            icon="i-lucide-archive"
                            :aria-pressed="includeArchived"
                            data-testid="analytics-filter-archived"
                            @click="
                                emit('update', {
                                    archived: includeArchived ? '' : 'true',
                                })
                            "
                        >
                            {{ $t('filter.archived') }}
                        </UButton>
                    </div>
                </div>
            </template>
        </FilterBar>
    </div>
</template>

<script setup lang="ts">
import {
    ANALYTICS_RANGES,
    type AnalyticsQuery,
    type AnalyticsRange,
} from '#shared/utils/analytics'
import { ROUTE_TYPES } from '~/utils/routes'

const props = defineProps<{
    query: AnalyticsQuery
    locations: { id: string; name: string }[]
}>()

const typeOptions: string[] = [...ROUTE_TYPES]

const emit = defineEmits<{ update: [patch: Partial<AnalyticsQuery>] }>()

const range = computed<AnalyticsRange>(() =>
    ANALYTICS_RANGES.includes(props.query.range as AnalyticsRange)
        ? (props.query.range as AnalyticsRange)
        : '90d',
)
const selectedLocations = computed(() =>
    (props.query.location ?? '').split(',').filter(Boolean),
)
const selectedTypes = computed(() =>
    (props.query.type ?? '').split(',').filter(Boolean),
)
const includeArchived = computed(() => props.query.archived === 'true')
const activeFilterCount = computed(
    () =>
        [
            selectedLocations.value.length,
            selectedTypes.value.length,
            includeArchived.value,
        ].filter(Boolean).length,
)

function selectRange(value: AnalyticsRange) {
    emit(
        'update',
        value === 'custom'
            ? { range: value }
            : { range: value, from: '', to: '' },
    )
}

function clearFilters() {
    emit('update', { location: '', type: '', archived: '' })
}
</script>

<style scoped>
.range-toggle {
    max-width: 100%;
    scrollbar-width: none;
}
</style>
