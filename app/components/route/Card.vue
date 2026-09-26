<template>
    <v-card
        variant="tonal"
        class="list-card route-card"
        :data-testid="`route-card-${route.id}`"
    >
        <!-- Header: [checkbox?] avatar · name + badges · difficulty -->
        <div class="list-card__header">
            <v-checkbox
                v-if="selectable"
                :model-value="modelValue"
                color="primary"
                hide-details
                density="compact"
                class="list-card__checkbox"
                data-testid="route-card-checkbox"
                @update:modelValue="$emit('update:modelValue', !!$event)"
            />
            <RouteColorDot :color="route.color" :ticked="ticked" :size="32" />
            <div class="list-card__title">
                <span class="list-card__name" data-testid="route-card-name">{{
                    route.name
                }}</span>
                <span
                    v-if="route.has_ratings || route.archived"
                    class="route-card__badges"
                >
                    <v-icon
                        v-if="route.has_ratings"
                        color="yellow-darken-2"
                        size="14"
                        >mdi-star-circle</v-icon
                    >
                    <v-chip
                        v-if="route.archived"
                        size="x-small"
                        variant="outlined"
                        class="ml-1"
                        >{{ $t('filter.archived') }}</v-chip
                    >
                </span>
            </div>
            <div v-if="difficulty" class="route-card__difficulty">
                <span>{{ difficultySplit.base }}</span
                ><span
                    v-if="difficultySplit.sign"
                    class="route-card__difficulty-sign"
                    >{{ difficultySplit.sign }}</span
                ><span
                    v-if="isUnexpectedSystem(route)"
                    class="route-card__difficulty-system"
                    >{{ $t(`gradeSystemsShort.${route.grade_system}`) }}</span
                >
            </div>
        </div>

        <v-divider />

        <!-- Compact meta section -->
        <div class="list-card__meta">
            <!-- Comment -->
            <div
                v-if="route.comment"
                class="list-card__meta-row list-card__meta-row--full"
            >
                <v-icon size="15" class="list-card__meta-icon"
                    >mdi-comment-text-outline</v-icon
                >
                <span class="route-card__comment">{{ route.comment }}</span>
            </div>

            <!-- Creators -->
            <div
                v-if="route.creator?.length"
                class="list-card__meta-row list-card__meta-row--full"
            >
                <v-icon size="15" class="list-card__meta-icon"
                    >mdi-account-hard-hat-outline</v-icon
                >
                <div class="d-flex flex-wrap" style="gap: 4px 4px">
                    <v-chip
                        v-for="c in route.creator"
                        :key="c"
                        size="x-small"
                        class="ma-0"
                        >{{ c }}</v-chip
                    >
                </div>
            </div>

            <!-- Inline pills: anchor · date · location · type · score -->
            <div class="list-card__pills">
                <span v-if="anchorPoint !== '—'" class="list-card__pill">
                    {{ $t('climbing.anchor_point') }} {{ anchorPoint }}
                </span>
                <span v-if="screwDate" class="list-card__pill">
                    <v-icon size="13">mdi-calendar-month-outline</v-icon>
                    {{ screwDate }}
                </span>
                <span v-if="locationName(route)" class="list-card__pill">
                    <v-icon size="13">mdi-map-marker-outline</v-icon>
                    {{ locationName(route) }}
                </span>
                <span v-if="route.type" class="list-card__pill">
                    <v-icon size="13">mdi-shape</v-icon>
                    {{ route.type }}
                </span>
                <span v-if="hasScore" class="list-card__pill">
                    <v-icon size="13">mdi-star</v-icon>
                    {{ score }}
                </span>
            </div>
        </div>

        <v-card-actions v-if="$slots.actions" class="list-card__actions">
            <v-spacer />
            <slot name="actions" />
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
import type { RouteListItem } from '~/types/models'
import {
    formatAnchorPoint,
    formatScore,
    formatDate,
    locationName,
} from '#shared/utils/formatting'
import { formatGrade } from '#shared/utils/grades'

const props = withDefaults(
    defineProps<{
        route: RouteListItem
        selectable?: boolean
        modelValue?: boolean
        ticked?: boolean
    }>(),
    {
        selectable: false,
        modelValue: false,
        ticked: false,
    },
)

defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const { locale } = useI18n()

const { isUnexpectedSystem } = useGradeSystems()
const difficulty = computed(() => formatGrade(props.route))
const difficultySplit = computed(() => {
    const full = difficulty.value
    const match = full.match(/^(.*?)([+\-]?)$/)
    return { base: match?.[1] ?? full, sign: match?.[2] ?? '' }
})
const anchorPoint = computed(() =>
    String(formatAnchorPoint(props.route.anchor_point)),
)
const screwDate = computed(() =>
    formatDate(props.route.screw_date, { locale: locale.value }),
)
const hasScore = computed(
    () =>
        typeof props.route.score === 'number' &&
        Number.isFinite(props.route.score),
)
const score = computed(() => formatScore(props.route))
</script>

<style scoped>
.route-card__difficulty {
    margin-left: auto;
    font-size: 1.4rem;
    font-weight: 700;
    line-height: 1;
    color: rgba(var(--v-theme-on-surface), 0.55);
    flex-shrink: 0;
}

.route-card__difficulty-sign {
    margin-left: 3px;
}

.route-card__difficulty-system {
    margin-left: 4px;
    font-size: 0.55em;
    font-weight: 500;
}

.route-card__badges {
    display: flex;
    align-items: center;
    gap: 4px;
}

.route-card__comment {
    font-size: 0.8rem;
    color: rgba(var(--v-theme-on-surface), 0.7);
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}
</style>
