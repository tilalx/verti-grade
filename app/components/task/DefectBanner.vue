<template>
    <UAlert
        v-if="defects.length"
        :color="urgent ? 'error' : 'warning'"
        variant="soft"
        icon="i-lucide-triangle-alert"
        :title="$t('tasks.defect.bannerTitle', defects.length)"
        :description="categoryLabels"
        data-testid="task-defect-banner"
    />
</template>

<script setup lang="ts">
import { isUrgentDefect } from '~/utils/tasks'
import type { OpenRouteDefectRecord } from '~/types/models'

const props = defineProps<{ defects: OpenRouteDefectRecord[] }>()

const { t } = useI18n()

const urgent = computed(() =>
    props.defects.some((defect) => isUrgentDefect(defect.category)),
)

const categoryLabels = computed(() =>
    [
        ...new Set(
            props.defects.map((defect) =>
                t(`tasks.categories.${defect.category}`),
            ),
        ),
    ].join(', '),
)
</script>
