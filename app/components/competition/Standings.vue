<template>
    <div class="flex flex-col gap-3" data-testid="competition-standings">
        <UAlert
            v-if="results?.visibility === 'frozen'"
            icon="i-lucide-snowflake"
            color="info"
            variant="soft"
            :title="$t('competitions.standings.frozen')"
            data-testid="competition-standings-frozen"
        />
        <UAlert
            v-else-if="results?.visibility === 'hidden'"
            icon="i-lucide-eye-off"
            color="neutral"
            variant="soft"
            :title="$t('competitions.standings.hidden')"
        />
        <template v-else-if="results">
            <UTabs
                v-if="results.categories.length > 1"
                v-model="activeCategory"
                :items="categoryItems"
                :content="false"
                :size="large ? 'xl' : 'sm'"
                class="w-full"
            />
            <LayoutEmptyState
                v-if="!rows.length"
                icon="i-lucide-trophy"
                :title="$t('competitions.standings.empty')"
                :card="false"
            />
            <ol v-else class="flex flex-col" :class="large ? 'gap-2' : 'gap-1'">
                <li
                    v-for="row in rows"
                    :key="row.entry"
                    class="flex items-center gap-3 rounded-lg px-3"
                    :class="[
                        large ? 'py-3 text-2xl' : 'py-2',
                        row.entry === highlightEntry
                            ? 'bg-primary/10 ring ring-primary/40'
                            : 'bg-elevated/40',
                    ]"
                    :data-testid="`standing-${row.bib}`"
                >
                    <span
                        class="w-10 shrink-0 text-center font-bold tabular-nums"
                        :class="MEDAL_CLASSES[row.rank] ?? 'text-muted'"
                        :data-testid="`standing-rank-${row.bib}`"
                        >{{ row.rank }}</span
                    >
                    <span class="w-12 shrink-0 text-sm text-muted tabular-nums"
                        >#{{ row.bib }}</span
                    >
                    <span
                        class="min-w-0 flex-1 truncate font-medium text-highlighted"
                    >
                        {{ row.name || $t('competitions.standings.anonymous') }}
                    </span>
                    <span
                        v-if="results.format !== 'lead_height'"
                        class="hidden text-sm text-muted tabular-nums sm:inline"
                    >
                        {{
                            $t('competitions.standings.topsZones', {
                                tops: row.tops,
                                zones: row.zones,
                            })
                        }}
                    </span>
                    <span
                        v-if="results.format !== 'tops'"
                        class="w-20 shrink-0 text-right font-semibold tabular-nums text-highlighted"
                        :data-testid="`standing-points-${row.bib}`"
                    >
                        {{ formatScore(row) }}
                    </span>
                </li>
            </ol>
            <p class="text-xs text-dimmed">
                {{
                    results.visibility === 'final'
                        ? $t('competitions.standings.final')
                        : $t('competitions.standings.updated', {
                              time: updatedTime,
                          })
                }}
            </p>
        </template>
    </div>
</template>

<script setup lang="ts">
import type {
    CompetitionResults,
    StandingRow,
} from '#shared/utils/competitionResults'

const MEDAL_CLASSES: Record<number, string> = {
    1: 'text-warning',
    2: 'text-toned',
    3: 'text-[#b06b3a]',
}

const props = defineProps<{
    results: CompetitionResults | null | undefined
    highlightEntry?: string | null
    large?: boolean
}>()

const activeCategory = defineModel<string>('category', { default: '' })

const { locale } = useI18n()

const categoryItems = computed(() =>
    (props.results?.categories ?? []).map((category) => ({
        label: category.name,
        value: category.id,
    })),
)

const currentCategory = computed(
    () =>
        props.results?.categories.find(
            (category) => category.id === activeCategory.value,
        ) ?? props.results?.categories[0],
)

const rows = computed(() => currentCategory.value?.rows ?? [])

watch(
    currentCategory,
    (category) => {
        if (category && category.id !== activeCategory.value) {
            activeCategory.value = category.id
        }
    },
    { immediate: true },
)

const updatedTime = computed(() =>
    props.results
        ? new Intl.DateTimeFormat(locale.value, { timeStyle: 'short' }).format(
              new Date(props.results.updated),
          )
        : '',
)

function formatScore(row: StandingRow) {
    const lead = row.rankPoints !== undefined
    return new Intl.NumberFormat(locale.value, {
        maximumFractionDigits: lead ? 3 : 2,
    }).format(lead ? row.rankPoints! : row.points)
}
</script>
