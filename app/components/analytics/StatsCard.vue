<template>
    <v-card class="stats-card" elevation="2">
        <v-card-text class="d-flex flex-column h-100">
            <div class="d-flex align-center justify-space-between mb-3">
                <div class="text-subtitle-2 text-medium-emphasis">
                    {{ title }}
                </div>
                <v-avatar v-if="icon" color="primary" size="40" class="icon-avatar">
                    <v-icon :icon="icon" size="24"></v-icon>
                </v-avatar>
            </div>
            <div class="flex-grow-1 d-flex flex-column justify-end">
                <div v-if="loading" class="d-flex">
                    <v-skeleton-loader class="w-100" type="text"></v-skeleton-loader>
                </div>
                <div v-else class="text-h4 font-weight-bold">
                    {{ formattedValue }}
                </div>
                <div v-if="subtitle" class="text-caption text-disabled mt-1">
                    {{ subtitle }}
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface StatsCardProps {
    title: string
    value: string | number
    icon?: string
    subtitle?: string
    loading?: boolean
    format?: (value: string | number) => string
}

const props = withDefaults(defineProps<StatsCardProps>(), {
    icon: undefined,
    subtitle: undefined,
    loading: false,
    format: (value: string | number) => `${value}`,
})

const formattedValue = computed(() => props.format(props.value))
</script>

<style scoped>
.stats-card {
    height: 100%;
    border-radius: 12px;
}

.icon-avatar {
    box-shadow: none;
}
</style>
