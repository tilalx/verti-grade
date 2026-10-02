<script setup lang="ts">
import type { LocationRecord, RouteRecord, WallRecord } from '~/types/models'
import { sanitizeGymMap } from '#shared/utils/mapGeometry'
import { cacheKeys } from '~/utils/realtimeCache'

const pb = usePocketbase()

const { data: unplaced } = useAsyncData(
    cacheKeys.unplacedRoutes,
    async () => {
        const [walls, locations] = await Promise.all([
            pb.collection('walls').getFullList<WallRecord>({
                fields: 'location',
                requestKey: 'unplacedWalls',
            }),
            pb.collection('locations').getFullList<LocationRecord>({
                fields: 'id,map',
                requestKey: 'unplacedLocations',
            }),
        ])
        const mapped = new Set(
            locations
                .filter((record) => sanitizeGymMap(record.map))
                .map((record) => record.id),
        )
        const locationIds = [
            ...new Set(
                walls
                    .map((wall) => wall.location)
                    .filter((id) => mapped.has(id)),
            ),
        ]
        if (!locationIds.length) return null
        const locationFilter = locationIds
            .map((id, index) =>
                pb.filter(`location = {:l${index}}`, { [`l${index}`]: id }),
            )
            .join(' || ')
        const result = await pb
            .collection('routes')
            .getList<RouteRecord>(1, 1, {
                filter: `archived = false && wall = "" && (${locationFilter})`,
                fields: 'location',
                sort: 'location',
                requestKey: 'unplacedRoutes',
            })
        return result.totalItems
            ? { count: result.totalItems, location: result.items[0]!.location }
            : null
    },
    { server: false, default: () => null },
)
</script>

<template>
    <UAlert
        v-if="unplaced"
        color="info"
        variant="soft"
        icon="i-lucide-map-pin"
        class="mb-4"
        data-testid="unplaced-banner"
    >
        <template #description>
            <div class="flex flex-wrap items-center gap-2">
                <span>{{
                    $t(
                        'mapPlacement.unplacedBanner',
                        { n: unplaced.count },
                        unplaced.count,
                    )
                }}</span>
                <div class="flex-1" />
                <UButton
                    size="sm"
                    color="info"
                    variant="soft"
                    :to="{
                        path: '/manage/map',
                        query: { location: unplaced.location },
                    }"
                    data-testid="unplaced-banner-open"
                >
                    {{ $t('routes.mapPlacement') }}
                </UButton>
            </div>
        </template>
    </UAlert>
</template>
