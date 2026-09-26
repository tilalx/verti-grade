<template>
    <v-container>
        <LayoutPageHeader
            :title="t('ticks.logbook')"
            :subtitle="t('ticks.logbookSubtitle')"
        >
            <template v-if="ticks.length" #actions>
                <div class="d-flex flex-wrap ga-2">
                    <v-btn-toggle
                        v-model="kind"
                        mandatory
                        density="compact"
                        variant="outlined"
                        color="primary"
                        divided
                        data-testid="logbook-kind"
                    >
                        <v-btn
                            v-for="option in LOGBOOK_KINDS"
                            :key="option"
                            :value="option"
                            :data-testid="`logbook-kind-${option}`"
                        >
                            {{ t(`ticks.kind.${option}`) }}
                        </v-btn>
                    </v-btn-toggle>
                    <v-btn-toggle
                        v-model="range"
                        mandatory
                        density="compact"
                        variant="outlined"
                        color="primary"
                        divided
                        data-testid="logbook-range"
                    >
                        <v-btn
                            v-for="option in LOGBOOK_RANGES"
                            :key="option"
                            :value="option"
                            :data-testid="`logbook-range-${option}`"
                        >
                            {{ t(`ticks.range.${option}`) }}
                        </v-btn>
                    </v-btn-toggle>
                </div>
            </template>
        </LayoutPageHeader>

        <template v-if="!ticks.length">
            <LayoutEmptyState
                icon="mdi-notebook-outline"
                :title="t('ticks.empty')"
                :hint="t('ticks.emptyHint')"
                class="mb-6"
                data-testid="logbook-empty"
            />
            <LogbookSuggestions :kind="null" :target-index="null" />
        </template>

        <template v-else>
            <v-row density="comfortable" class="mb-2">
                <v-col
                    v-for="tile in tiles"
                    :key="tile.key"
                    cols="6"
                    md="3"
                    class="d-flex"
                    :data-testid="`logbook-stat-${tile.key}`"
                >
                    <AnalyticsStatsCard
                        class="w-100"
                        :title="tile.title"
                        :value="tile.value"
                        :previous="tile.previous"
                        :icon="tile.icon"
                        :color="tile.color"
                        :format="tile.format"
                        :meter="tile.meter"
                        :subtitle="tile.subtitle"
                    />
                </v-col>
            </v-row>

            <v-tabs
                v-model="tab"
                color="primary"
                class="mb-4"
                data-testid="logbook-tabs"
            >
                <v-tab value="sessions" data-testid="logbook-tab-sessions">
                    {{ t('ticks.tabs.sessions') }}
                </v-tab>
                <v-tab value="stats" data-testid="logbook-tab-stats">
                    {{ t('ticks.tabs.stats') }}
                </v-tab>
                <v-tab value="projects" data-testid="logbook-tab-projects">
                    {{ t('ticks.tabs.projects') }}
                    <v-chip
                        v-if="projects.length"
                        size="x-small"
                        class="ml-2"
                        data-testid="logbook-projects-count"
                    >
                        {{ projects.length }}
                    </v-chip>
                </v-tab>
            </v-tabs>

            <v-tabs-window v-model="tab">
                <v-tabs-window-item value="sessions">
                    <v-row density="comfortable">
                        <v-col
                            v-for="(session, index) in sessions"
                            :key="session.day"
                            cols="12"
                            lg="6"
                        >
                            <LogbookSessionCard
                                :day="session.day"
                                :ticks="session.ticks"
                                :initially-open="index < 2"
                                @edit="openEdit"
                                @delete="deleteTarget = $event"
                            />
                        </v-col>
                    </v-row>
                </v-tabs-window-item>

                <v-tabs-window-item value="stats">
                    <v-row density="comfortable">
                        <v-col cols="12" md="6">
                            <AnalyticsSection
                                :title="t('ticks.pyramid.title')"
                                :subtitle="t('ticks.pyramid.subtitle')"
                                icon="mdi-triangle-outline"
                                :empty="!pyramid.length"
                                :empty-text="t('ticks.chartEmpty')"
                                testid="logbook-section-pyramid"
                            >
                                <LogbookPyramidChart :rows="pyramid" />
                            </AnalyticsSection>
                        </v-col>
                        <v-col cols="12" md="6">
                            <AnalyticsSection
                                :title="t('ticks.progression.title')"
                                :subtitle="t('ticks.progression.subtitle')"
                                icon="mdi-chart-line"
                                :empty="!progressionPoints.some((p) => p.sends)"
                                :empty-text="t('ticks.chartEmpty')"
                                testid="logbook-section-progression"
                            >
                                <LogbookProgressionChart
                                    :points="progressionPoints"
                                    :system="gradeSystemFor(routeType)"
                                />
                            </AnalyticsSection>
                        </v-col>
                    </v-row>
                </v-tabs-window-item>

                <v-tabs-window-item value="projects">
                    <LogbookProjects
                        v-if="projects.length"
                        :projects="projects"
                        @log="openLog"
                    />
                    <LayoutEmptyState
                        v-else
                        icon="mdi-target"
                        :title="t('ticks.projects.empty')"
                        :hint="t('ticks.projects.emptyHint')"
                        class="mb-6"
                        data-testid="logbook-projects-empty"
                    />
                    <LogbookSuggestions
                        v-if="!projects.length"
                        :kind="kind"
                        :target-index="targetIndex"
                    />
                </v-tabs-window-item>
            </v-tabs-window>
        </template>

        <TickDialog
            v-model="editOpen"
            :tick="editing"
            :route-id="logRouteId"
            @saved="reload"
        />

        <ConfirmDialog
            :model-value="!!deleteTarget"
            :title="t('actions.confirm')"
            :message="t('ticks.deleteConfirm')"
            :loading="deleting"
            @update:model-value="deleteTarget = null"
            @confirm="confirmDelete"
        />
    </v-container>
</template>

<script setup lang="ts">
import type { RouteRecord, TickRecord } from '~/types/models'
import { groupTicksByDay } from '#shared/utils/ticks'
import {
    gradePyramid,
    logbookStats,
    medianSendIndex,
    openProjects,
    preferredKind,
    progression,
    type LogbookKind,
    type LogbookRange,
    type LogbookTick,
} from '#shared/utils/logbook'

type LoggedTick = TickRecord & { expand?: { route?: RouteRecord } }

const LOGBOOK_KINDS: LogbookKind[] = ['boulder', 'route']
const LOGBOOK_RANGES: LogbookRange[] = ['30d', '12m', 'all']

const { t } = useI18n()
const pb = usePocketbase()
const { notify, error: notifyError } = useNotification()
const { refreshTickedRoutes } = useTickedRoutes()
const { gradeSystemFor } = useGradeSystems()

useHead({ title: t('page.title.logbook') })

definePageMeta({
    middleware: ['auth'],
})

// ponytail: loads the whole logbook at once, paginate by session once logbooks grow into the thousands
const { data: ticks, refresh } = await useAsyncData(
    'logbook',
    () =>
        pb.collection('ticks').getFullList<LoggedTick>({
            sort: '-date,-created',
            expand: 'route',
            requestKey: null,
        }),
    { default: () => [] },
)

const logbookTicks = computed<LogbookTick[]>(() =>
    ticks.value.map((tick) => ({
        ...tick,
        routeArchived: !!tick.expand?.route?.archived,
    })),
)

const kind = ref<LogbookKind>(preferredKind(logbookTicks.value))
const range = ref<LogbookRange>('12m')
const tab = ref('sessions')
const routeType = computed(() =>
    kind.value === 'boulder' ? 'Boulder' : 'Route',
)

const sessions = computed(() => groupTicksByDay(ticks.value))
const stats = computed(() =>
    logbookStats(logbookTicks.value, kind.value, range.value),
)
const pyramid = computed(() =>
    gradePyramid(logbookTicks.value, kind.value, range.value),
)
const progressionPoints = computed(() =>
    progression(logbookTicks.value, kind.value),
)
const targetIndex = computed(() =>
    medianSendIndex(logbookTicks.value, kind.value),
)

const routesById = computed(
    () =>
        new Map(
            ticks.value
                .map((tick) => tick.expand?.route)
                .filter((route): route is RouteRecord => !!route)
                .map((route) => [route.id, route]),
        ),
)
const projects = computed(() =>
    openProjects(logbookTicks.value).map((project) => ({
        ...project,
        record: routesById.value.get(project.route),
    })),
)

const tiles = computed(() => {
    const { current, previous } = stats.value
    const percent = (value: number | null) =>
        value === null ? null : Math.round(value * 100)
    return [
        {
            key: 'sends',
            title: t('ticks.stats.sends'),
            value: current.sends,
            previous: previous?.sends ?? null,
            icon: 'mdi-flag-checkered',
            color: 'success',
            format: undefined,
            meter: undefined,
            subtitle: undefined,
        },
        {
            key: 'hardest',
            title: t('ticks.stats.hardest'),
            value: current.hardest?.grade_index ?? null,
            previous: null,
            icon: 'mdi-trending-up',
            color: 'primary',
            format: () => current.hardest?.grade ?? '—',
            meter: undefined,
            subtitle: previous?.hardest
                ? t('ticks.stats.previousHardest', {
                      grade: previous.hardest.grade,
                  })
                : undefined,
        },
        {
            key: 'flashRate',
            title: t('ticks.stats.flashRate'),
            value: percent(current.flashRate),
            previous: percent(previous?.flashRate ?? null),
            icon: 'mdi-lightning-bolt',
            color: 'amber-darken-2',
            format: (value: number) => `${value}%`,
            meter: current.flashRate ?? undefined,
            subtitle: undefined,
        },
        {
            key: 'sessions',
            title: t('ticks.stats.sessions'),
            value: current.sessions,
            previous: previous?.sessions ?? null,
            icon: 'mdi-calendar-check-outline',
            color: 'info',
            format: undefined,
            meter: undefined,
            subtitle: undefined,
        },
    ]
})

const editOpen = ref(false)
const editing = ref<TickRecord | null>(null)
const logRouteId = ref<string | null>(null)
const deleteTarget = ref<TickRecord | null>(null)
const deleting = ref(false)

function reload() {
    return Promise.all([refresh(), refreshTickedRoutes()])
}

function openEdit(tick: TickRecord) {
    logRouteId.value = null
    editing.value = tick
    editOpen.value = true
}

function openLog(routeId: string) {
    editing.value = null
    logRouteId.value = routeId
    editOpen.value = true
}

async function confirmDelete() {
    if (!deleteTarget.value) return
    deleting.value = true
    try {
        await pb.collection('ticks').delete(deleteTarget.value.id)
        notify(t('ticks.deleted'))
        deleteTarget.value = null
        await reload()
    } catch (err) {
        console.error('Deleting tick failed:', err)
        notifyError(t('notifications.error.delete'))
    } finally {
        deleting.value = false
    }
}
</script>
