<template>
    <span class="grade-label">
        <span>{{ formatGrade(source) }}</span>
        <span
            v-if="system && formatGrade(source) && isUnexpectedSystem(source!)"
            class="grade-label__system"
            :title="$t(`gradeSystems.${system}`)"
            >{{ $t(`gradeSystemsShort.${system}`) }}</span
        >
    </span>
</template>

<script setup lang="ts">
import {
    formatGrade,
    isGradeSystem,
    type GradeSource,
} from '#shared/utils/grades'

const props = defineProps<{
    source: (GradeSource & { type?: string | null }) | null | undefined
}>()

const { isUnexpectedSystem } = useGradeSystems()

const system = computed(() =>
    isGradeSystem(props.source?.grade_system)
        ? props.source.grade_system
        : null,
)
</script>

<style scoped>
.grade-label {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    white-space: nowrap;
}

.grade-label__system {
    font-size: 0.7em;
    font-weight: 500;
    opacity: 0.7;
}
</style>
