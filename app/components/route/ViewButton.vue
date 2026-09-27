<template>
    <v-tooltip v-if="compact" :text="$t('routes.view')" location="top">
        <template #activator="{ props: tooltip }">
            <v-btn
                v-bind="tooltip"
                :to="`/route?id=${routeId}`"
                variant="tonal"
                min-width="36"
                class="px-0"
                :aria-label="$t('routes.view')"
                data-testid="route-view"
            >
                <v-icon icon="mdi-chevron-right" />
            </v-btn>
        </template>
    </v-tooltip>
    <v-btn
        v-else
        :to="`/route?id=${routeId}`"
        variant="tonal"
        append-icon="mdi-chevron-right"
        data-testid="route-view"
    >
        {{ $t('routes.view') }}
    </v-btn>
</template>

<script setup lang="ts">
defineProps<{ routeId: string; compact?: boolean }>()
</script>
