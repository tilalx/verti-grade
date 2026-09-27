<script setup lang="ts">
import type { RouteRecord, WallRecord } from '~/types/models'

const pb = usePocketbase()

const { data: unplaced, refresh } = useAsyncData(
    'unplaced-routes',
    async () => {
        const walls = await pb.collection('walls').getFullList<WallRecord>({
            fields: 'location',
            requestKey: 'unplacedWalls',
        })
        const locationIds = [...new Set(walls.map((wall) => wall.location))]
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

const { subscribe } = usePbSubscription()
onMounted(() => subscribe('routes', () => void refresh()).catch(() => {}))
</script>

<template>
    <v-alert
        v-if="unplaced"
        type="info"
        variant="tonal"
        density="compact"
        icon="mdi-map-marker-question-outline"
        class="mb-4"
        data-testid="unplaced-banner"
    >
        <div class="d-flex flex-wrap align-center ga-2">
            <span>{{
                $t('mapPlacement.unplacedBanner', { n: unplaced.count })
            }}</span>
            <v-spacer />
            <v-btn
                size="small"
                variant="tonal"
                :to="{
                    path: '/manage/map',
                    query: { location: unplaced.location },
                }"
                data-testid="unplaced-banner-open"
            >
                {{ $t('routes.mapPlacement') }}
            </v-btn>
        </div>
    </v-alert>
</template>
