<template>
    <v-container>
        <LayoutPageHeader
            :title="t('ticks.logbook')"
            :subtitle="t('ticks.logbookSubtitle')"
        />

        <LayoutEmptyState
            v-if="!sessions.length"
            icon="mdi-notebook-outline"
            :title="t('ticks.empty')"
            :hint="t('ticks.emptyHint')"
            data-testid="logbook-empty"
        />

        <section
            v-for="session in sessions"
            :key="session.day"
            class="mb-6"
            :data-testid="`logbook-day-${session.day}`"
        >
            <div class="d-flex align-baseline justify-space-between mb-2">
                <h2 class="text-title-medium font-weight-bold">
                    {{ formatSessionDay(session.day) }}
                </h2>
                <span class="text-body-small text-medium-emphasis">
                    {{
                        t('ticks.sendCount', {
                            count: sendCount(session.ticks),
                        })
                    }}
                </span>
            </div>

            <v-row density="comfortable">
                <v-col
                    v-for="tick in session.ticks"
                    :key="tick.id"
                    cols="12"
                    md="6"
                    xl="4"
                >
                    <v-card
                        variant="tonal"
                        class="h-100"
                        data-testid="logbook-tick"
                        :data-tick-id="tick.id"
                    >
                        <div class="d-flex align-center ga-3 pa-3">
                            <RouteColorDot
                                :color="routeOf(tick)?.color"
                                :size="32"
                            />
                            <div class="flex-grow-1 logbook-tick__body">
                                <NuxtLink
                                    v-if="routeOf(tick)"
                                    :to="`/route?id=${tick.route}`"
                                    class="logbook-tick__name"
                                    data-testid="logbook-tick-route"
                                >
                                    {{ routeOf(tick)?.name }}
                                </NuxtLink>
                                <span v-else class="text-medium-emphasis">
                                    {{ t('ticks.removedRoute') }}
                                </span>
                                <div
                                    class="d-flex align-center ga-2 mt-1 flex-wrap"
                                >
                                    <v-chip
                                        size="x-small"
                                        variant="flat"
                                        :color="TYPE_COLORS[tick.type]"
                                        data-testid="logbook-tick-type"
                                    >
                                        {{ t(`ticks.types.${tick.type}`) }}
                                    </v-chip>
                                    <span
                                        v-if="
                                            tick.type !== 'flash' &&
                                            tick.attempts > 1
                                        "
                                        class="text-body-small text-medium-emphasis"
                                        data-testid="logbook-tick-attempts"
                                    >
                                        {{
                                            t('ticks.attemptCount', {
                                                count: tick.attempts,
                                            })
                                        }}
                                    </span>
                                    <v-chip
                                        v-if="routeOf(tick)?.archived"
                                        size="x-small"
                                        variant="outlined"
                                    >
                                        {{ t('filter.archived') }}
                                    </v-chip>
                                </div>
                                <p
                                    v-if="tick.note"
                                    class="text-body-small mt-1 mb-0"
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
                                        :aria-label="t('ticks.moreActions')"
                                        data-testid="logbook-tick-menu"
                                    />
                                </template>
                                <v-list density="compact">
                                    <v-list-item
                                        prepend-icon="mdi-pencil-outline"
                                        :title="t('actions.edit')"
                                        data-testid="logbook-tick-edit"
                                        @click="openEdit(tick)"
                                    />
                                    <v-list-item
                                        prepend-icon="mdi-delete-outline"
                                        :title="t('actions.delete')"
                                        base-color="error"
                                        data-testid="logbook-tick-delete"
                                        @click="deleteTarget = tick"
                                    />
                                </v-list>
                            </v-menu>
                        </div>
                    </v-card>
                </v-col>
            </v-row>
        </section>

        <TickDialog v-model="editOpen" :tick="editing" @saved="reload" />

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
import type { TickType } from '#shared/utils/ticks'
import { groupTicksByDay, tickDate } from '#shared/utils/ticks'
import { formatDate } from '#shared/utils/formatting'

type LogbookTick = TickRecord & { expand?: { route?: RouteRecord } }

const TYPE_COLORS: Record<TickType, string> = {
    flash: 'amber-darken-2',
    top: 'success',
    attempt: 'blue-grey-darken-1',
}

const { t, locale } = useI18n()
const pb = usePocketbase()
const { notify, error: notifyError } = useNotification()
const { refreshTickedRoutes } = useTickedRoutes()

useHead({ title: t('page.title.logbook') })

definePageMeta({
    middleware: ['auth'],
})

// ponytail: loads the whole logbook at once, paginate by session once logbooks grow into the thousands
const { data: ticks, refresh } = await useAsyncData(
    'logbook',
    () =>
        pb.collection('ticks').getFullList<LogbookTick>({
            sort: '-date,-created',
            expand: 'route',
            requestKey: null,
        }),
    { default: () => [] },
)

const sessions = computed(() => groupTicksByDay(ticks.value))

const editOpen = ref(false)
const editing = ref<TickRecord | null>(null)
const deleteTarget = ref<TickRecord | null>(null)
const deleting = ref(false)

function routeOf(tick: LogbookTick) {
    return tick.expand?.route
}

function sendCount(dayTicks: TickRecord[]) {
    return dayTicks.filter((tick) => tick.type !== 'attempt').length
}

function formatSessionDay(day: string) {
    return formatDate(tickDate(day), {
        locale: locale.value,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

function reload() {
    return Promise.all([refresh(), refreshTickedRoutes()])
}

function openEdit(tick: TickRecord) {
    editing.value = tick
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
