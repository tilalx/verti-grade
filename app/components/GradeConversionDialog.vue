<template>
    <LayoutDialogShell
        v-model="open"
        :title="$t('gradeConversion.title')"
        :subtitle="$t('gradeConversion.source', { source: IRCRA_SOURCE })"
        :max-width="1200"
        closable
        sheet-on-mobile
        data-testid="grade-conversion-dialog"
    >
        <template #activator="{ props: activatorProps }">
            <slot name="activator" :props="activatorProps">
                <v-btn
                    v-bind="activatorProps"
                    variant="text"
                    size="small"
                    prepend-icon="mdi-swap-horizontal"
                    data-testid="grade-conversion-open"
                >
                    {{ $t('gradeConversion.open') }}
                </v-btn>
            </slot>
        </template>

        <v-chip-group
            v-model="visibleKeys"
            multiple
            filter
            class="mb-1"
            data-testid="grade-conversion-columns"
        >
            <v-chip
                v-for="column in toggleableColumns"
                :key="column.key"
                :value="column.key"
                size="small"
                variant="outlined"
                :data-testid="`grade-conversion-toggle-${column.key}`"
            >
                {{ column.title }}
            </v-chip>
        </v-chip-group>

        <div class="grade-conversion">
            <div
                class="grade-conversion__grid grade-conversion__header"
                :style="gridStyle"
            >
                <div
                    v-for="column in visibleColumns"
                    :key="column.key"
                    :class="{ 'grade-conversion--active': column.active }"
                    :title="column.title"
                >
                    {{
                        smAndUp
                            ? column.title
                            : (column.shortTitle ?? column.title)
                    }}
                </div>
            </div>

            <div
                class="grade-conversion__grid grade-conversion__body"
                :style="{ ...gridStyle, '--rows': IRCRA_LEVELS.length }"
            >
                <div
                    v-for="column in visibleColumns"
                    :key="column.key"
                    class="grade-conversion__column"
                    :class="{
                        'grade-conversion--active': column.active,
                        'grade-conversion__column--ircra':
                            column.key === 'ircra',
                    }"
                    :data-testid="`grade-conversion-column-${column.key}`"
                >
                    <template
                        v-for="(lane, laneIndex) in column.lanes"
                        :key="laneIndex"
                    >
                        <span
                            v-for="[label, from, to] in lane"
                            :key="label"
                            class="grade-conversion__band-cell"
                            :style="
                                bandStyle(from, to, laneIndex, column.lanes)
                            "
                            :data-testid="`grade-conversion-${column.key}-${label}`"
                            >{{ label }}</span
                        >
                    </template>
                    <span
                        v-for="[label, index] in column.labels"
                        :key="label"
                        class="grade-conversion__label"
                        :class="{
                            'grade-conversion__label--highlight': isHighlighted(
                                column.key,
                                label,
                            ),
                        }"
                        :style="positionOf(index)"
                        :data-testid="`grade-conversion-${column.key}-${label}`"
                        >{{ label }}</span
                    >
                </div>

                <div
                    v-if="highlightIndex !== null"
                    class="grade-conversion__band"
                    :style="positionOf(highlightIndex)"
                    data-testid="grade-conversion-band"
                />
            </div>
        </div>
    </LayoutDialogShell>
</template>

<script setup lang="ts">
import {
    GRADE_TABLES,
    IRCRA_LEVELS,
    IRCRA_SOURCE,
    gradeIndex,
    type GradeSource,
    type GradeSystem,
} from '#shared/utils/grades'
import {
    BRAZILIAN,
    BRITISH_TECH_LANES,
    EWBANK,
    FEMALE_LEVELS,
    MALE_LEVELS,
    METRIC_UIAA,
    WATTS,
    type ReferenceBand,
    type ReferenceLabels,
} from '~/utils/gradeReference'

interface ConversionColumn {
    key: string
    title: string
    shortTitle?: string
    active?: boolean
    labels?: ReferenceLabels
    lanes?: ReferenceBand[][]
}

const props = defineProps<{
    source?: GradeSource | null
}>()

const { t } = useI18n()
const { smAndUp } = useDisplay()
const open = ref(false)
const visibleKeys = ref<string[] | null>(null)
const { routeGradeSystem, boulderGradeSystem } = useGradeSystems()

function systemColumn(system: GradeSystem): ConversionColumn {
    return {
        key: system,
        title: t(`gradeSystems.${system}`),
        shortTitle: t(`gradeSystemsShort.${system}`),
        active: [routeGradeSystem.value, boulderGradeSystem.value].includes(
            system,
        ),
        labels: GRADE_TABLES[system],
    }
}

function levelColumn(key: string, bands: ReferenceBand[]): ConversionColumn {
    return {
        key,
        title: t(`gradeConversion.columns.${key}`),
        lanes: [
            bands.map(([level, from, to]) => [
                t(`gradeConversion.levels.${level}`),
                from,
                to,
            ]),
        ],
    }
}

const columns = computed<ConversionColumn[]>(() => [
    levelColumn('male', MALE_LEVELS),
    levelColumn('female', FEMALE_LEVELS),
    systemColumn('v'),
    systemColumn('font'),
    {
        key: 'ircra',
        title: 'IRCRA',
        labels: IRCRA_LEVELS.map((level) => [String(level), level]),
    },
    systemColumn('yds'),
    systemColumn('french'),
    {
        key: 'britishTech',
        title: t('gradeConversion.columns.britishTech'),
        lanes: BRITISH_TECH_LANES,
    },
    {
        key: 'ewbank',
        title: t('gradeConversion.columns.ewbank'),
        labels: EWBANK,
    },
    {
        key: 'brazilian',
        title: t('gradeConversion.columns.brazilian'),
        labels: BRAZILIAN,
    },
    systemColumn('uiaa'),
    {
        key: 'metricUiaa',
        title: t('gradeConversion.columns.metricUiaa'),
        labels: GRADE_TABLES.uiaa.map(([label, index]) => [
            METRIC_UIAA[label] ?? label,
            index,
        ]),
    },
    {
        key: 'watts',
        title: t('gradeConversion.columns.watts'),
        labels: WATTS,
    },
])

const toggleableColumns = computed(() =>
    columns.value.filter((column) => column.key !== 'ircra'),
)

const visibleColumns = computed(() =>
    columns.value.filter(
        (column) =>
            column.key === 'ircra' || visibleKeys.value?.includes(column.key),
    ),
)

type ColumnWidth = [track: string, min: number]

const DEFAULT_WIDTH: ColumnWidth = ['minmax(52px, 1fr)', 52]

const COLUMN_WIDTHS: Record<string, ColumnWidth> = {
    male: ['88px', 88],
    female: ['88px', 88],
    ircra: ['44px', 44],
}

const gridStyle = computed(() => {
    const widths = visibleColumns.value.map(
        (column) => COLUMN_WIDTHS[column.key] ?? DEFAULT_WIDTH,
    )
    return {
        gridTemplateColumns: widths.map(([track]) => track).join(' '),
        minWidth: `${widths.reduce((sum, [, min]) => sum + min, 0)}px`,
    }
})

const highlightIndex = computed(() =>
    gradeIndex(props.source?.grade_system, props.source?.grade),
)

function isHighlighted(columnKey: string, label: string) {
    return (
        columnKey === props.source?.grade_system &&
        label === props.source?.grade
    )
}

function positionOf(index: number) {
    return { top: `calc(${index - 0.5} * var(--row-height))` }
}

function bandStyle(
    from: number,
    to: number,
    laneIndex: number,
    lanes: ReferenceBand[][] = [],
) {
    const width = 100 / lanes.length
    return {
        top: `calc(${from - 0.5} * var(--row-height))`,
        height: `calc(${to - from} * var(--row-height))`,
        left: `${laneIndex * width}%`,
        width: `${width}%`,
    }
}

watch(open, async (isOpen) => {
    if (isOpen && visibleKeys.value === null) {
        visibleKeys.value = toggleableColumns.value
            .filter((column) => smAndUp.value || column.key in GRADE_TABLES)
            .map((column) => column.key)
    }
    if (!isOpen || highlightIndex.value === null) return
    await nextTick()
    document
        .querySelector('[data-testid="grade-conversion-band"]')
        ?.scrollIntoView({ block: 'center' })
})
</script>

<style scoped>
.grade-conversion {
    --row-height: 34px;
    max-height: 58vh;
    overflow: auto;
}

.grade-conversion__grid {
    display: grid;
}

.grade-conversion__header {
    position: sticky;
    top: 0;
    z-index: 2;
    background: rgb(var(--v-theme-surface));
}

.grade-conversion__header > div {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 8px 4px;
    text-align: center;
    font-weight: 600;
    font-size: 0.8rem;
    border-bottom: 1px solid
        rgba(var(--v-border-color), var(--v-border-opacity));
}

.grade-conversion__body {
    position: relative;
    height: calc(var(--rows) * var(--row-height));
    background: repeating-linear-gradient(
        to bottom,
        transparent 0 var(--row-height),
        rgba(var(--v-theme-on-surface), 0.04) var(--row-height)
            calc(2 * var(--row-height))
    );
}

.grade-conversion__column {
    position: relative;
    font-size: 0.85rem;
}

.grade-conversion__column--ircra {
    font-weight: 700;
    background: rgba(var(--v-theme-on-surface), 0.05);
}

.grade-conversion__label {
    position: absolute;
    left: 0;
    right: 0;
    transform: translateY(-50%);
    text-align: center;
    white-space: nowrap;
}

.grade-conversion__band-cell {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    text-align: center;
    font-size: 0.75rem;
    line-height: 1.2;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.25);
    border-radius: 4px;
}

.grade-conversion--active {
    font-weight: 600;
}

.grade-conversion__label--highlight {
    color: rgb(var(--v-theme-primary));
    font-weight: 800;
}

.grade-conversion__band {
    position: absolute;
    left: 0;
    right: 0;
    height: var(--row-height);
    transform: translateY(-50%);
    background: rgba(var(--v-theme-primary), 0.12);
    pointer-events: none;
}
</style>
