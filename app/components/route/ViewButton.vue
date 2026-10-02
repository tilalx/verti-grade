<template>
    <UTooltip v-if="compact" :text="$t('routes.view')">
        <UButton
            :to="`/route?id=${routeId}`"
            variant="soft"
            color="neutral"
            icon="i-lucide-chevron-right"
            :aria-label="$t('routes.view')"
            data-testid="route-view"
        />
    </UTooltip>
    <UButton
        v-else
        :to="`/route?id=${routeId}`"
        variant="soft"
        color="neutral"
        trailing-icon="i-lucide-chevron-right"
        data-testid="route-view"
    >
        {{ $t('routes.view') }}
    </UButton>
</template>

<script setup lang="ts">
defineProps<{ routeId: string; compact?: boolean }>()
</script>
