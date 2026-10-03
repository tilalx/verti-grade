<template>
    <section
        class="flex flex-col gap-3 rounded-lg bg-default p-4 ring ring-default"
        data-testid="competition-scorecard"
    >
        <div class="flex flex-wrap items-center gap-2">
            <h2 class="flex-1 text-lg font-semibold text-highlighted">
                {{ $t('competitions.scorecard.title') }}
            </h2>
            <UBadge color="success" variant="soft" data-testid="scorecard-tops">
                {{
                    $t(
                        'competitions.scorecard.tops',
                        { n: summary.tops },
                        summary.tops,
                    )
                }}
            </UBadge>
            <UBadge v-if="summary.flashes" color="warning" variant="soft">
                {{
                    $t(
                        'competitions.scorecard.flashes',
                        { n: summary.flashes },
                        summary.flashes,
                    )
                }}
            </UBadge>
            <UBadge
                v-if="pendingCount"
                :color="offline ? 'warning' : 'neutral'"
                variant="outline"
                icon="i-lucide-cloud-off"
                data-testid="scorecard-pending"
            >
                {{
                    offline
                        ? $t('competitions.scorecard.offline', {
                              n: pendingCount,
                          })
                        : $t('competitions.scorecard.saving')
                }}
            </UBadge>
        </div>

        <UTabs
            v-model="filter"
            :items="filterItems"
            :content="false"
            size="sm"
            class="w-full"
        />

        <LayoutEmptyState
            v-if="!visibleRoutes.length"
            icon="i-lucide-check-check"
            :title="$t('competitions.scorecard.nothingHere')"
            :card="false"
        />
        <ul v-else class="flex flex-col gap-2">
            <li
                v-for="compRoute in visibleRoutes"
                :key="compRoute.id"
                class="flex flex-col gap-3 rounded-lg p-3 ring sm:flex-row sm:items-center"
                :class="
                    scoreOf(compRoute).topAttempt
                        ? 'bg-success/5 ring-success/40'
                        : 'ring-default'
                "
                :data-testid="`scorecard-route-${compRoute.number}`"
            >
                <div class="flex min-w-0 flex-1 items-center gap-3">
                    <span
                        class="w-8 text-center text-lg font-bold tabular-nums text-highlighted"
                        >{{ compRoute.number }}</span
                    >
                    <RouteColorDot
                        :color="routeOf(compRoute)?.color"
                        :ticked="!!scoreOf(compRoute).topAttempt"
                        :size="28"
                    />
                    <div class="min-w-0 flex-1">
                        <p class="truncate font-medium text-highlighted">
                            {{ routeOf(compRoute)?.name }}
                        </p>
                        <GradeLabel
                            v-if="routeOf(compRoute)"
                            :source="routeOf(compRoute)!"
                            class="text-xs text-muted"
                        />
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                    <div
                        v-if="isRope"
                        class="flex rounded-md ring ring-default"
                        role="group"
                        :aria-label="$t('competitions.scorecard.style')"
                    >
                        <UButton
                            v-for="style in STYLES"
                            :key="style"
                            size="sm"
                            :color="
                                styleOf(compRoute) === style
                                    ? 'primary'
                                    : 'neutral'
                            "
                            :variant="
                                styleOf(compRoute) === style ? 'soft' : 'ghost'
                            "
                            :aria-pressed="styleOf(compRoute) === style"
                            :data-testid="`scorecard-style-${compRoute.number}-${style}`"
                            @click="act(compRoute, { type: 'style', style })"
                        >
                            {{ $t(`competitions.scorecard.styles.${style}`) }}
                        </UButton>
                    </div>

                    <div class="flex items-center gap-1">
                        <UButton
                            icon="i-lucide-minus"
                            color="neutral"
                            variant="outline"
                            class="icon-btn"
                            :aria-label="
                                $t('competitions.scorecard.undoAttempt')
                            "
                            :data-testid="`scorecard-undo-${compRoute.number}`"
                            @click="act(compRoute, { type: 'undoAttempt' })"
                        />
                        <span
                            class="min-w-16 text-center text-sm tabular-nums"
                            :data-testid="`scorecard-attempts-${compRoute.number}`"
                        >
                            {{
                                $t(
                                    'competitions.scorecard.attempts',
                                    { n: scoreOf(compRoute).attempts },
                                    scoreOf(compRoute).attempts,
                                )
                            }}
                        </span>
                        <UButton
                            icon="i-lucide-plus"
                            color="neutral"
                            variant="outline"
                            class="icon-btn"
                            :disabled="!!scoreOf(compRoute).topAttempt"
                            :aria-label="
                                $t('competitions.scorecard.addAttempt')
                            "
                            :data-testid="`scorecard-attempt-${compRoute.number}`"
                            @click="act(compRoute, { type: 'attempt' })"
                        />
                    </div>

                    <UButton
                        v-if="compRoute.zone"
                        :color="
                            scoreOf(compRoute).zoneAttempt ? 'info' : 'neutral'
                        "
                        :variant="
                            scoreOf(compRoute).zoneAttempt ? 'soft' : 'outline'
                        "
                        :aria-pressed="!!scoreOf(compRoute).zoneAttempt"
                        :disabled="!!scoreOf(compRoute).topAttempt"
                        :data-testid="`scorecard-zone-${compRoute.number}`"
                        @click="act(compRoute, { type: 'zone' })"
                    >
                        {{ $t('competitions.zone') }}
                    </UButton>
                    <UButton
                        :icon="
                            scoreOf(compRoute).topAttempt
                                ? 'i-lucide-circle-check'
                                : 'i-lucide-flag'
                        "
                        :color="
                            scoreOf(compRoute).topAttempt
                                ? 'success'
                                : 'primary'
                        "
                        :variant="
                            scoreOf(compRoute).topAttempt ? 'solid' : 'soft'
                        "
                        :aria-pressed="!!scoreOf(compRoute).topAttempt"
                        :data-testid="`scorecard-top-${compRoute.number}`"
                        @click="act(compRoute, { type: 'top' })"
                    >
                        {{
                            isFlash(scoreOf(compRoute))
                                ? $t('competitions.scorecard.flash')
                                : $t('competitions.scorecard.top')
                        }}
                    </UButton>
                </div>
            </li>
        </ul>
    </section>
</template>

<script setup lang="ts">
import { EMPTY_SCORE, isFlash } from '~/utils/scorecard'
import type { ClimbStyle } from '#shared/utils/competitionScoring'
import type {
    CompetitionEntryRecord,
    CompetitionRecord,
    CompetitionRouteRecord,
    RouteRecord,
} from '~/types/models'

const STYLES: ClimbStyle[] = ['lead', 'toprope']

const props = defineProps<{
    competition: CompetitionRecord
    entry: CompetitionEntryRecord
}>()

const pb = usePocketbase()
const { t } = useI18n()

const filter = ref<'open' | 'all' | 'topped'>('all')
const entryId = computed(() => props.entry.id)
const { scores, pendingCount, offline, load, act } = useScorecard(entryId)

const isRope = computed(() => props.competition.discipline === 'rope')

const { data: compRoutes } = useAsyncData(
    () => `scorecard-routes:${props.competition.id}`,
    () =>
        pb
            .collection('competition_routes')
            .getFullList<CompetitionRouteRecord>({
                filter: pb.filter('competition = {:id} && voided = false', {
                    id: props.competition.id,
                }),
                sort: 'number',
                expand: 'route',
            }),
    { default: () => [] },
)

const scoreOf = (compRoute: CompetitionRouteRecord) =>
    scores.value[compRoute.id] ?? EMPTY_SCORE
const styleOf = (compRoute: CompetitionRouteRecord) =>
    scoreOf(compRoute).style || 'lead'
const routeOf = (compRoute: CompetitionRouteRecord) =>
    compRoute.expand?.route as RouteRecord | undefined

const summary = computed(() => {
    const all = Object.values(scores.value)
    return {
        tops: all.filter((score) => score.topAttempt).length,
        flashes: all.filter(isFlash).length,
    }
})

const filterItems = computed(() => [
    { label: t('competitions.scorecard.filters.all'), value: 'all' },
    { label: t('competitions.scorecard.filters.open'), value: 'open' },
    { label: t('competitions.scorecard.filters.topped'), value: 'topped' },
])

const visibleRoutes = computed(() =>
    compRoutes.value.filter((compRoute) => {
        const topped = !!scoreOf(compRoute).topAttempt
        if (filter.value === 'open') return !topped
        if (filter.value === 'topped') return topped
        return true
    }),
)

onMounted(() => void load())

const reloadSoon = coalesce(() => load(), 400)
useCompetitionLive(
    computed(() => props.competition.id),
    ({ kind, entry }) => {
        if (
            (kind === 'scores' && entry === props.entry.id) ||
            kind === 'resync'
        ) {
            reloadSoon()
        }
    },
)
</script>
