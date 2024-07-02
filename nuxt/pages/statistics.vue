<template>
    <v-row>
        <v-col>
            <StatisticsWeeklyHeatmap :theme="currentTheme" />
        </v-col>
    </v-row>
</template>

<script setup>
import { ref, computed } from 'vue'
import StatisticsWeeklyHeatmap from '@/components/statistics/weeklyHeatmap.vue'
import { useMainStore } from '~/stores/main'

// Store and reactive variables
const mainStore = useMainStore()
const currentTheme = computed(() => mainStore.getColorTheme)

// Set head
useHead({
    title: 'Statistics - Verti-Grade',
    meta: [
        {
            name: 'description',
            content: 'Statistics for Verti-Grade',
        },
    ],
})

// Page meta
definePageMeta({
    authRequired: true,
    middleware: ['auth'],
})

</script>