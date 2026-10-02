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
        <div class="grid grid-cols-12 gap-3">
            <div
                v-for="route in suggestions"
                :key="route.id"
                class="col-span-12 sm:col-span-6 lg:col-span-4"
            >
                <NuxtLink
                    :to="`/route?id=${route.id}`"
                    class="suggestion rounded-lg bg-elevated p-3 flex items-center gap-3"
                    data-testid="logbook-suggestion"
                >
                    <RouteColorDot :color="route.color" :size="32" />
                    <div class="grow suggestion__body">
                        <div class="font-medium suggestion__name">
                            {{ route.name }}
                        </div>
                        <div class="text-xs text-muted">
                            {{
                                locationName(route) ||
                                (route.type &&
                                    $t(
                                        `routes.types.${route.type.toLowerCase()}`,
                                    ))
                            }}
                        </div>
                    </div>
                    <UBadge
                        v-if="isNew(route)"
                        size="sm"
                        color="primary"
                        variant="solid"
                    >
                        {{ $t('ticks.suggestions.new') }}
                    </UBadge>
                    <GradeLabel :source="route" />
                    <UIcon name="i-lucide-chevron-right" class="size-4" />
                </NuxtLink>
            </div>
        </div>
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
.suggestion {
    color: inherit;
    text-decoration: none;
}

.suggestion:hover {
    background: var(--ui-bg-accented);
}

.suggestion__body {
    min-width: 0;
}

.suggestion__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
