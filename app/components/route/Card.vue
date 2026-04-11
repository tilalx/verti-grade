<template>
    <v-card variant="tonal" class="route-card">
        <!-- Header: [checkbox?] avatar · name + badges · difficulty -->
        <div class="route-card__header">
            <v-checkbox
                v-if="selectable"
                :model-value="modelValue"
                color="primary"
                hide-details
                density="compact"
                class="route-card__checkbox"
                @update:modelValue="$emit('update:modelValue', $event)"
            />
            <v-avatar
                :color="route.color ?? undefined"
                size="32"
                class="flex-shrink-0"
            />
            <div class="route-card__title">
                <span class="route-card__name">{{ route.name }}</span>
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
                ><span v-if="difficultySplit.sign" class="route-card__difficulty-sign">{{ difficultySplit.sign }}</span>
            </div>
        </div>

        <v-divider />

        <!-- Compact meta section -->
        <div class="route-card__meta">
            <!-- Comment -->
            <div
                v-if="route.comment"
                class="route-card__meta-row route-card__meta-row--full"
            >
                <v-icon size="15" class="route-card__meta-icon"
                    >mdi-comment-text-outline</v-icon
                >
                <span class="route-card__comment">{{ route.comment }}</span>
            </div>

            <!-- Creators -->
            <div
                v-if="route.creator?.length"
                class="route-card__meta-row route-card__meta-row--full"
            >
                <v-icon size="15" class="route-card__meta-icon"
                    >mdi-account-hard-hat</v-icon
                >
                <div class="d-flex flex-wrap" style="gap: 4px 4px;">
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
            <div class="route-card__pills">
                <span v-if="anchorPoint !== '—'" class="route-card__pill">
                    {{ $t('climbing.anchor_point') }} {{ anchorPoint }}
                </span>
                <span v-if="screwDate" class="route-card__pill">
                    <v-icon size="13">mdi-calendar-month</v-icon>
                    {{ screwDate }}
                </span>
                <span v-if="route.location" class="route-card__pill">
                    <v-icon size="13">mdi-map-marker</v-icon>
                    {{ route.location }}
                </span>
                <span v-if="route.type" class="route-card__pill">
                    <v-icon size="13">mdi-shape</v-icon>
                    {{ route.type }}
                </span>
                <span v-if="hasScore" class="route-card__pill">
                    <v-icon size="13">mdi-star</v-icon>
                    {{ score }}
                </span>
            </div>
        </div>

        <v-card-actions v-if="$slots.actions" class="route-card__actions">
            <v-spacer />
            <slot name="actions" />
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
import type { RouteListItem } from '~/types/models'
import {
    formatDifficulty,
    formatAnchorPoint,
    formatScore,
} from '~/utils/formatting'

const props = withDefaults(
    defineProps<{
        route: RouteListItem
        selectable?: boolean
        modelValue?: boolean
    }>(),
    {
        selectable: false,
        modelValue: false,
    },
)

defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const { locale } = useI18n()

const difficulty = computed(() => formatDifficulty(props.route))
const difficultySplit = computed(() => {
    const full = difficulty.value
    const match = full.match(/^(.*?)([+\-]?)$/)
    return { base: match?.[1] ?? full, sign: match?.[2] ?? '' }
})
const anchorPoint = computed(() =>
    String(formatAnchorPoint(props.route.anchor_point)),
)
const screwDate = computed(() => {
    const d = props.route.screw_date
    if (!d) return ''
    try {
        return new Date(d).toLocaleDateString(locale.value ?? undefined)
    } catch {
        return ''
    }
})
const hasScore = computed(
    () =>
        typeof props.route.score === 'number' &&
        Number.isFinite(props.route.score),
)
const score = computed(() => formatScore(props.route))
</script>

<style scoped>
.route-card {
    position: relative;
    overflow: hidden;
}

.route-card__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
}

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

.route-card__checkbox {
    margin: 0;
    padding: 0;
    flex-shrink: 0;
}

.route-card__title {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.route-card__name {
    font-weight: 600;
    font-size: 1rem;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.route-card__badges {
    display: flex;
    align-items: center;
    gap: 4px;
}

/* Meta block */
.route-card__meta {
    padding: 10px 16px 6px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.route-card__meta-row {
    display: flex;
    align-items: flex-start;
    gap: 7px;
}

.route-card__meta-row--full {
    width: 100%;
}

.route-card__meta-icon {
    flex-shrink: 0;
    margin-top: 2px;
    opacity: 0.65;
}

.route-card__comment {
    font-size: 0.8rem;
    color: rgba(var(--v-theme-on-surface), 0.7);
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

/* Inline pill row */
.route-card__pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 2px;
}

.route-card__pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.7);
    background: rgba(var(--v-theme-on-surface), 0.06);
    border-radius: 6px;
    padding: 3px 8px;
}

.route-card__actions {
    padding: 6px 10px 8px;
    min-height: unset;
}
</style>
