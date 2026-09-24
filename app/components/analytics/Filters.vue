<template>
    <div data-testid="analytics-filters">
        <FilterBar
            :active-filter-count="activeFilterCount"
            @clear="clearFilters"
        >
            <template #search>
                <div class="flex-grow-1 min-w-0">
                    <v-btn-toggle
                        :model-value="range"
                        mandatory
                        variant="outlined"
                        color="primary"
                        divided
                        rounded="lg"
                        density="compact"
                        class="range-toggle"
                        @update:model-value="selectRange"
                    >
                        <v-btn
                            v-for="option in ANALYTICS_RANGES"
                            :key="option"
                            :value="option"
                            size="small"
                            :data-testid="`analytics-range-${option}`"
                        >
                            {{ $t(`analytics.filters.ranges.${option}`) }}
                        </v-btn>
                    </v-btn-toggle>
                </div>
            </template>

            <template #filters>
                <v-row density="comfortable" align="center">
                    <template v-if="range === 'custom'">
                        <v-col cols="6" sm="3" md="2">
                            <v-text-field
                                :model-value="query.from ?? ''"
                                type="date"
                                :label="$t('analytics.filters.from')"
                                density="compact"
                                hide-details
                                data-testid="analytics-filter-from"
                                @update:model-value="
                                    emit('update', { from: $event })
                                "
                            />
                        </v-col>
                        <v-col cols="6" sm="3" md="2">
                            <v-text-field
                                :model-value="query.to ?? ''"
                                type="date"
                                :label="$t('analytics.filters.to')"
                                density="compact"
                                hide-details
                                data-testid="analytics-filter-to"
                                @update:model-value="
                                    emit('update', { to: $event })
                                "
                            />
                        </v-col>
                    </template>
                    <v-col cols="12" sm="6" md="3">
                        <v-select
                            :model-value="selectedLocations"
                            :items="locations"
                            item-title="name"
                            item-value="id"
                            :label="$t('analytics.filters.locations')"
                            multiple
                            chips
                            closable-chips
                            density="compact"
                            hide-details
                            data-testid="analytics-filter-location"
                            @update:model-value="
                                emit('update', { location: $event.join(',') })
                            "
                        />
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <v-select
                            :model-value="selectedTypes"
                            :items="typeOptions"
                            :label="$t('analytics.filters.types')"
                            multiple
                            chips
                            closable-chips
                            density="compact"
                            hide-details
                            data-testid="analytics-filter-type"
                            @update:model-value="
                                emit('update', { type: $event.join(',') })
                            "
                        />
                    </v-col>
                    <v-col cols="12" sm="6" md="auto">
                        <v-switch
                            :model-value="query.archived === 'true'"
                            :label="$t('analytics.filters.includeArchived')"
                            color="primary"
                            density="compact"
                            hide-details
                            inset
                            data-testid="analytics-filter-archived"
                            @update:model-value="
                                emit('update', {
                                    archived: $event ? 'true' : '',
                                })
                            "
                        />
                    </v-col>
                </v-row>
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
const activeFilterCount = computed(
    () =>
        [
            selectedLocations.value.length,
            selectedTypes.value.length,
            props.query.archived === 'true',
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
.min-w-0 {
    min-width: 0;
}

.range-toggle {
    max-width: 100%;
    scrollbar-width: none;
}
</style>
