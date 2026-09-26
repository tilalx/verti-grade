<template>
    <div
        class="d-flex align-center ga-3 py-2"
        data-testid="logbook-tick"
        :data-tick-id="tick.id"
    >
        <RouteColorDot :color="route?.color" :size="28" />
        <div class="flex-grow-1 logbook-tick__body">
            <NuxtLink
                v-if="route"
                :to="`/route?id=${tick.route}`"
                class="logbook-tick__name"
                data-testid="logbook-tick-route"
            >
                {{ route.name }}
            </NuxtLink>
            <span v-else class="text-medium-emphasis">
                {{ $t('ticks.removedRoute') }}
            </span>
            <div class="d-flex align-center ga-2 mt-1 flex-wrap">
                <v-chip
                    size="x-small"
                    variant="flat"
                    :color="TICK_TYPE_COLORS[tick.type]"
                    :prepend-icon="TICK_TYPE_ICONS[tick.type]"
                    data-testid="logbook-tick-type"
                >
                    {{ $t(`ticks.types.${tick.type}`) }}
                </v-chip>
                <span
                    v-if="tick.type !== 'flash' && tick.attempts > 1"
                    class="text-body-small text-medium-emphasis"
                    data-testid="logbook-tick-attempts"
                >
                    {{ $t('ticks.attemptCount', { count: tick.attempts }) }}
                </span>
                <v-chip
                    v-if="route?.archived"
                    size="x-small"
                    variant="outlined"
                >
                    {{ $t('filter.archived') }}
                </v-chip>
            </div>
            <p
                v-if="tick.note"
                class="text-body-small mt-1 mb-0 text-medium-emphasis"
                data-testid="logbook-tick-note"
            >
                {{ tick.note }}
            </p>
        </div>
        <GradeLabel :source="tick" />
        <v-menu location="bottom end">
            <template #activator="{ props: menu }">
                <v-btn
                    v-bind="menu"
                    icon="mdi-dots-vertical"
                    variant="text"
                    size="small"
                    :aria-label="$t('ticks.moreActions')"
                    data-testid="logbook-tick-menu"
                />
            </template>
            <v-list density="compact">
                <v-list-item
                    prepend-icon="mdi-pencil-outline"
                    :title="$t('actions.edit')"
                    data-testid="logbook-tick-edit"
                    @click="emit('edit', tick)"
                />
                <v-list-item
                    prepend-icon="mdi-delete-outline"
                    :title="$t('actions.delete')"
                    base-color="error"
                    data-testid="logbook-tick-delete"
                    @click="emit('delete', tick)"
                />
            </v-list>
        </v-menu>
    </div>
</template>

<script setup lang="ts">
import type { RouteRecord, TickRecord } from '~/types/models'
import { TICK_TYPE_COLORS, TICK_TYPE_ICONS } from '~/utils/ticks'

const props = defineProps<{
    tick: TickRecord & { expand?: { route?: RouteRecord } }
}>()

const emit = defineEmits<{
    edit: [tick: TickRecord]
    delete: [tick: TickRecord]
}>()

const route = computed(() => props.tick.expand?.route)
</script>

<style scoped>
.logbook-tick__body {
    min-width: 0;
}

.logbook-tick__name {
    display: block;
    font-weight: 500;
    color: inherit;
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.logbook-tick__name:hover {
    text-decoration: underline;
}
</style>
