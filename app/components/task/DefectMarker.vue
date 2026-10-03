<template>
    <UIcon
        v-if="severity"
        name="i-lucide-triangle-alert"
        role="img"
        :aria-label="$t('tasks.defect.marker')"
        :title="$t('tasks.defect.marker')"
        class="shrink-0"
        :class="[
            severity === 'urgent' ? 'text-error' : 'text-warning',
            size === 'sm' ? 'size-[14px]' : 'size-4',
        ]"
        data-testid="route-defect-marker"
        :data-severity="severity"
    />
</template>

<script setup lang="ts">
import type { DefectSeverity } from '~/utils/tasks'

defineProps<{ severity?: DefectSeverity; size?: 'sm' | 'md' }>()
</script>
