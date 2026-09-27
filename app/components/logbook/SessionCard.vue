<template>
    <v-card variant="tonal" class="h-100" :data-testid="`logbook-day-${day}`">
        <button
            type="button"
            class="session-card__header pa-4"
            :aria-expanded="open"
            data-testid="logbook-session-toggle"
            @click="open = !open"
        >
            <div class="flex-grow-1 text-left">
                <h2 class="text-title-small font-weight-bold mb-2">
                    {{ formattedDay }}
                </h2>
                <div class="d-flex flex-wrap ga-2">
                    <v-chip
                        size="small"
                        prepend-icon="mdi-format-list-bulleted"
                    >
                        {{
                            $t('ticks.session.climbs', {
                                count: summary.climbs,
                            })
                        }}
                    </v-chip>
                    <v-chip
                        size="small"
                        color="success"
                        prepend-icon="mdi-flag-checkered"
                        data-testid="logbook-session-sends"
                    >
                        {{ $t('ticks.sendCount', { count: summary.sends }) }}
                    </v-chip>
                    <v-chip
                        v-if="summary.flashes"
                        size="small"
                        color="amber-darken-2"
                        prepend-icon="mdi-lightning-bolt"
                    >
                        {{
                            $t('ticks.session.flashes', {
                                count: summary.flashes,
                            })
                        }}
                    </v-chip>
                    <v-chip
                        v-if="summary.hardest"
                        size="small"
                        color="primary"
                        prepend-icon="mdi-trending-up"
                        data-testid="logbook-session-hardest"
                    >
                        {{
                            $t('ticks.session.hardest', {
                                grade: summary.hardest.grade,
                            })
                        }}
                    </v-chip>
                </div>
            </div>
            <v-icon :icon="open ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
        </button>
        <v-expand-transition>
            <div v-show="open" class="px-4 pb-2">
                <v-divider class="mb-1" />
                <template v-for="(tick, index) in ticks" :key="tick.id">
                    <v-divider v-if="index" />
                    <LogbookTickRow
                        :tick="tick"
                        @edit="emit('edit', $event)"
                        @delete="emit('delete', $event)"
                    />
                </template>
            </div>
        </v-expand-transition>
    </v-card>
</template>

<script setup lang="ts">
import type { RouteRecord, TickRecord } from '~/types/models'
import { formatDate } from '#shared/utils/formatting'
import { sessionSummary } from '#shared/utils/logbook'
import { tickDate } from '#shared/utils/ticks'

const props = defineProps<{
    day: string
    ticks: (TickRecord & { expand?: { route?: RouteRecord } })[]
    initiallyOpen?: boolean
}>()

const emit = defineEmits<{
    edit: [tick: TickRecord]
    delete: [tick: TickRecord]
}>()

const { locale } = useI18n()
const open = ref(props.initiallyOpen ?? false)

const summary = computed(() => sessionSummary(props.ticks))
const formattedDay = computed(() =>
    formatDate(tickDate(props.day), {
        locale: locale.value,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }),
)
</script>

<style scoped>
.session-card__header {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    color: inherit;
    background: none;
    border: 0;
    cursor: pointer;
}
</style>
