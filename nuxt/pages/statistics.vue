<template>
    <v-row>
        <v-col>
            <StatisticsWeeklyHeatmap />
        </v-col>
    </v-row>
</template>

<script>
import { ref } from 'vue'
import StatisticsWeeklyHeatmap from '@/components/statistics/weeklyHeatmap.vue'

export default {
    name: 'Statistics',
    components: {
        StatisticsWeeklyHeatmap,
    },
    setup() {
        useHead({
            title: 'Statistics - Verti-Grade',
            meta: [
                {
                    name: 'description',
                    content: 'Statistics for Verti-Grade',
                },
            ],
        })
        definePageMeta({
            authRequired: true,
            middleware: ['auth'],
        })

        const selectedDate = ref(new Date())
        return {
            selectedDate,
        }
    },
}
</script>
