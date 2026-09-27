<template>
    <div
        class="manage-row"
        :class="{ 'manage-row--selected': selected }"
        data-testid="routes-row"
        :data-route-id="route.id"
    >
        <v-checkbox-btn
            :model-value="selected"
            density="compact"
            color="primary"
            class="manage-row__check"
            :aria-label="$t('actions.select_route', { name: route.name })"
            data-testid="routes-row-select"
            @update:model-value="emit('update:selected', !!$event)"
        />
        <button
            type="button"
            class="manage-row__main"
            data-testid="routes-row-open"
            @click="emit('edit')"
        >
            <RouteColorDot :color="route.color" :size="28" />
            <span class="manage-row__text">
                <span class="manage-row__name">
                    {{ route.name }}
                    <v-icon
                        v-if="route.has_ratings"
                        size="14"
                        color="yellow-darken-2"
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
                <span class="manage-row__meta">{{ meta }}</span>
            </span>
            <span class="manage-row__grade"
                ><GradeLabel :source="route"
            /></span>
        </button>
        <div class="manage-row__actions">
            <slot name="actions" />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { RouteListItem } from '~/types/models'
import {
    formatAnchorPoint,
    formatDate,
    locationName,
} from '#shared/utils/formatting'

const props = defineProps<{
    route: RouteListItem
    selected: boolean
}>()

const emit = defineEmits<{
    'update:selected': [value: boolean]
    edit: []
}>()

const { t, locale } = useI18n()

const meta = computed(() => {
    const anchor = formatAnchorPoint(props.route.anchor_point)
    return [
        ['—', '-'].includes(String(anchor))
            ? ''
            : `${t('climbing.anchor_point')} ${anchor}`,
        formatDate(props.route.screw_date, { locale: locale.value }),
        locationName(props.route),
        props.route.creator?.join(', '),
    ]
        .filter(Boolean)
        .join(' · ')
})
</script>

<style scoped>
.manage-row {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 64px;
    padding: 4px 4px 4px 0;
    border-bottom: 1px solid
        rgba(var(--v-border-color), var(--v-border-opacity));
}

.manage-row--selected {
    background: rgba(var(--v-theme-primary), 0.08);
}

.manage-row__check {
    flex: 0 0 auto;
}

.manage-row__main {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
    padding: 6px 4px;
    border: 0;
    background: none;
    color: inherit;
    text-align: left;
    cursor: pointer;
    border-radius: 8px;
}

.manage-row__main:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
}

.manage-row__text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
}

.manage-row__name {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.manage-row__meta {
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.manage-row__grade {
    flex: 0 0 auto;
    font-weight: 700;
    font-size: 1.05rem;
}

.manage-row__actions {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
}
</style>
