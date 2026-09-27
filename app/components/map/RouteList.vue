<template>
    <div class="map-route-list">
        <template v-for="group in groups" :key="group.id">
            <p
                v-if="showHeadings"
                class="map-route-list__heading"
                data-testid="map-list-group"
            >
                {{ group.name }}
                <span class="map-route-list__muted">
                    · {{ group.routes.length }}</span
                >
            </p>
            <div
                v-for="route in group.routes"
                :key="route.id"
                class="map-route-row"
                :class="{
                    'map-route-row--active': route.id === selectedRouteId,
                }"
                data-testid="map-list-route"
                :data-route-id="route.id"
            >
                <button
                    type="button"
                    class="map-route-row__main"
                    @click="emit('select', route.id)"
                >
                    <span
                        class="map-route-row__dot"
                        :style="{ background: dotColor(route.color) }"
                    >
                        <span
                            v-if="tickedIds.has(route.id)"
                            class="map-route-row__tick mdi mdi-check-bold"
                            role="img"
                            :aria-label="$t('ticks.sent')"
                        />
                    </span>
                    <span class="map-route-row__text">
                        <span class="map-route-row__name">{{
                            route.name
                        }}</span>
                        <span class="map-route-row__meta">{{
                            subtitle(route)
                        }}</span>
                    </span>
                    <span class="map-route-row__grade"
                        >{{ formatGrade(route)
                        }}<small
                            v-if="
                                route.grade_system && isUnexpectedSystem(route)
                            "
                            class="map-route-row__system"
                            >{{
                                $t(`gradeSystemsShort.${route.grade_system}`)
                            }}</small
                        ></span
                    >
                </button>
                <NuxtLink
                    :to="`/route?id=${route.id}`"
                    class="map-route-row__open"
                    :aria-label="$t('routes.view')"
                    :title="$t('routes.view')"
                    data-testid="route-view"
                >
                    <span class="mdi mdi-chevron-right" aria-hidden="true" />
                </NuxtLink>
            </div>
        </template>
        <LayoutEmptyState
            v-if="!groups.length"
            :card="false"
            :title="$t('table.no_data')"
        />
    </div>
</template>

<script setup lang="ts">
import type { RouteListItem } from '~/types/models'
import { formatAnchorPoint } from '#shared/utils/formatting'
import { formatGrade } from '#shared/utils/grades'
import { dotColors } from '~/utils/gymMap'

defineProps<{
    groups: { id: string; name: string; routes: RouteListItem[] }[]
    showHeadings: boolean
    tickedIds: ReadonlySet<string>
    selectedRouteId: string | null
}>()

const emit = defineEmits<{ select: [routeId: string] }>()
const { t } = useI18n()
const { isUnexpectedSystem } = useGradeSystems()

const dotColor = (color: string | null | undefined) => dotColors(color).fill

function subtitle(route: RouteListItem) {
    const anchor = formatAnchorPoint(route.anchor_point)
    const parts = [
        route.type ? t(`routes.types.${route.type.toLowerCase()}`) : '',
        ['—', '-'].includes(String(anchor))
            ? ''
            : `${t('climbing.anchor_point')} ${anchor}`,
    ]
    return parts.filter(Boolean).join(' · ')
}
</script>

<style scoped>
.map-route-list__heading {
    margin: 12px 8px 4px;
    font-weight: 600;
}

.map-route-list__muted {
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.map-route-row {
    display: flex;
    align-items: center;
    border-radius: 8px;
    content-visibility: auto;
    contain-intrinsic-size: auto 56px;
}

.map-route-row--active {
    background: rgba(var(--v-theme-primary), 0.12);
}

.map-route-row__main {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
    min-height: 56px;
    padding: 6px 8px;
    border: 0;
    background: none;
    color: inherit;
    text-align: left;
    cursor: pointer;
    border-radius: 8px;
}

.map-route-row__main:hover {
    background: rgba(var(--v-theme-on-surface), 0.04);
}

.map-route-row__main:focus-visible,
.map-route-row__open:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: -2px;
}

.map-route-row__dot {
    position: relative;
    flex: 0 0 26px;
    height: 26px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px rgba(var(--v-theme-on-surface), 0.24);
}

.map-route-row__tick {
    position: absolute;
    right: -4px;
    bottom: -4px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    font-size: 11px;
    background: rgb(var(--v-theme-success));
    color: rgb(var(--v-theme-on-success));
    box-shadow: 0 0 0 2px rgb(var(--v-theme-surface));
}

.map-route-row__text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
}

.map-route-row__name {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.map-route-row__meta {
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.map-route-row__grade {
    flex: 0 0 auto;
    font-weight: 700;
    font-size: 1rem;
}

.map-route-row__system {
    margin-left: 3px;
    font-size: 0.65rem;
    font-weight: 500;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.map-route-row__open {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 36px;
    height: 36px;
    margin-right: 4px;
    border-radius: 8px;
    color: inherit;
    font-size: 20px;
    text-decoration: none;
    background: rgba(var(--v-theme-on-surface), 0.08);
}
</style>
