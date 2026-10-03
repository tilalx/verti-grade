<template>
    <UFieldGroup :data-testid="`analytics-discipline-${section}`">
        <UButton
            v-for="option in options"
            :key="option"
            size="xs"
            :color="modelValue === option ? 'primary' : 'neutral'"
            :variant="modelValue === option ? 'soft' : 'outline'"
            :aria-pressed="modelValue === option"
            :data-testid="`analytics-discipline-${section}-${option}`"
            @click="emit('update:modelValue', option)"
        >
            {{ label(option) }}
        </UButton>
    </UFieldGroup>
</template>

<script setup lang="ts">
import type { Discipline } from '#shared/utils/analytics'

defineProps<{
    modelValue: Discipline
    section: string
    options: readonly Discipline[]
    label: (option: Discipline) => string
}>()
const emit = defineEmits<{ 'update:modelValue': [Discipline] }>()
</script>
