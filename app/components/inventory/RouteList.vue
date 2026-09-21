<template>
    <v-list
        v-if="routes.length"
        density="compact"
        class="scope-list rounded-lg"
        border
    >
        <v-list-item
            v-for="route in routes"
            :key="route.id"
            :data-testid="`inventory-${rowPrefix}-${route.id}`"
        >
            <template #prepend>
                <span v-if="mode === 'missing'" class="anchor-badge">
                    {{ formatAnchorPoint(route.anchor_point) }}
                </span>
                <v-icon v-else size="16" color="success" class="mr-3">
                    mdi-check-circle-outline
                </v-icon>
            </template>
            <v-list-item-title class="text-body-medium">
                {{ route.name }}
            </v-list-item-title>
            <template #append>
                <span class="text-body-small text-medium-emphasis mr-2">
                    {{ formatDifficulty(route) }}
                </span>
                <v-btn
                    :icon="mode === 'missing' ? 'mdi-check' : 'mdi-undo'"
                    variant="text"
                    size="small"
                    :aria-label="actionLabel"
                    :data-testid="`inventory-${actionPrefix}-${route.id}`"
                    @click="emit('action', route)"
                />
            </template>
        </v-list-item>
    </v-list>

    <LayoutEmptyState
        v-else
        :card="false"
        :icon="emptyIcon"
        :title="emptyTitle"
    />
</template>

<script setup lang="ts">
import { formatAnchorPoint, formatDifficulty } from '~/utils/formatting'
import type { RouteRecord } from '~/types/models'

const props = defineProps<{
    routes: RouteRecord[]
    mode: 'missing' | 'found'
    emptyIcon: string
    emptyTitle: string
}>()

const emit = defineEmits<{ (e: 'action', route: RouteRecord): void }>()

const { t } = useI18n()

const rowPrefix = computed(() =>
    props.mode === 'missing' ? 'missing' : 'scanned',
)
const actionPrefix = computed(() =>
    props.mode === 'missing' ? 'mark' : 'undo',
)
const actionLabel = computed(() =>
    props.mode === 'missing' ? t('inventory.markFound') : t('inventory.undo'),
)
</script>
