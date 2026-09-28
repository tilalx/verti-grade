<template>
    <span class="grade-label" data-testid="grade-label">
        <span>{{ grade }}</span>
        <span
            v-if="system"
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

const props = withDefaults(
    defineProps<{
        source: (GradeSource & { type?: string | null }) | null | undefined
        showSystem?: boolean
    }>(),
    { showSystem: undefined },
)

const gradeSystems = props.showSystem === undefined ? useGradeSystems() : null

const grade = computed(() => formatGrade(props.source))

const system = computed(() => {
    const value = props.source?.grade_system
    if (!grade.value || !isGradeSystem(value)) return null
    const visible =
        props.showSystem ?? gradeSystems?.isUnexpectedSystem(props.source!)
    return visible ? value : null
})
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
