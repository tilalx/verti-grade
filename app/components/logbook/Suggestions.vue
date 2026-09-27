<template>
    <section v-if="suggestions.length" data-testid="logbook-suggestions">
        <LayoutSectionHeader
            :title="$t('ticks.suggestions.title')"
            :subtitle="
                targetIndex === null
                    ? $t('ticks.suggestions.subtitleNew')
                    : $t('ticks.suggestions.subtitle')
            "
        />
        <v-row density="comfortable">
            <v-col
                v-for="route in suggestions"
                :key="route.id"
                cols="12"
                sm="6"
                lg="4"
            >
                <v-card
                    variant="tonal"
                    :to="`/route?id=${route.id}`"
                    class="pa-3 d-flex align-center ga-3"
                    data-testid="logbook-suggestion"
                >
                    <RouteColorDot :color="route.color" :size="32" />
                    <div class="flex-grow-1 suggestion__body">
                        <div class="font-weight-medium suggestion__name">
                            {{ route.name }}
                        </div>
                        <div class="text-body-small text-medium-emphasis">
                            {{ locationName(route) || route.type }}
                        </div>
                    </div>
                    <v-chip
                        v-if="isNew(route)"
                        size="x-small"
                        color="primary"
                        variant="flat"
                    >
                        {{ $t('ticks.suggestions.new') }}
                    </v-chip>
                    <GradeLabel :source="route" />
                    <v-icon icon="mdi-chevron-right" size="small" />
                </v-card>
            </v-col>
        </v-row>
    </section>
</template>

<script setup lang="ts">
import type { RouteRecord } from '~/types/models'
import type { LogbookKind } from '#shared/utils/logbook'
import { locationName } from '#shared/utils/formatting'

const SUGGESTION_COUNT = 6
const CANDIDATE_COUNT = 40
const NEW_ROUTE_DAYS = 30

const props = defineProps<{
    kind: LogbookKind | null
    targetIndex: number | null
}>()

const pb = usePocketbase()
const { tickedRouteIds } = useTickedRoutes()

const { data: candidates } = useAsyncData(
    () => `logbook-suggestions-${props.kind ?? 'any'}`,
    () =>
        pb
            .collection('routes')
            .getList<RouteRecord>(1, CANDIDATE_COUNT, {
                filter: props.kind
                    ? pb.filter('archived = false && type = {:type}', {
                          type: props.kind === 'boulder' ? 'Boulder' : 'Route',
                      })
                    : 'archived = false',
                sort: '-created',
                expand: 'location',
                requestKey: null,
            })
            .then((page) => page.items)
            .catch(() => []),
    { default: () => [] },
)

const newSince = Date.now() - NEW_ROUTE_DAYS * 86_400_000

function isNew(route: RouteRecord) {
    return !!route.created && new Date(route.created).getTime() > newSince
}

const suggestions = computed(() => {
    const open = candidates.value.filter(
        (route) => !tickedRouteIds.value.has(route.id),
    )
    const target = props.targetIndex
    if (target === null) return open.slice(0, SUGGESTION_COUNT)
    const distance = (route: RouteRecord) =>
        typeof route.grade_index === 'number'
            ? Math.abs(route.grade_index - target)
            : Number.POSITIVE_INFINITY
    return [...open]
        .sort((a, b) => distance(a) - distance(b))
        .slice(0, SUGGESTION_COUNT)
})
</script>

<style scoped>
.suggestion__body {
    min-width: 0;
}

.suggestion__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
