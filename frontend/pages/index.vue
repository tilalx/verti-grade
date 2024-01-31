<template>
    <v-app>
        <v-main>
            <v-container>
                <v-row>
                    <v-col cols="6" sm="3">
                        <v-text-field
                            :label="$t('climbing.searchRouteName')"
                            v-model="searchRouteName"
                            class="mt-2"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-select
                            :label="$t('climbing.difficulty')"
                            :items="difficulties"
                            v-model="selectedDifficulty"
                            item-title="text"
                            item-value="value"
                            class="mt-2"
                        ></v-select>
                    </v-col>

                    <!-- Column for the Location select -->
                    <v-col cols="6" sm="3">
                        <v-select
                            :label="$t('climbing.location')"
                            :items="locations"
                            v-model="selectedLocation"
                            item-title="text"
                            item-value="value"
                            class="mt-2"
                        ></v-select>
                    </v-col>
                </v-row>
                <v-data-table :headers="headers" :items="filteredClimbingRoutes" item-key="id">
                    <template v-slot:[`item`]="{ item: climbingRoute }">
                        <tr>
                        <td>
                            <v-avatar :color="climbingRoute.color" size="30"></v-avatar>
                        </td>
                        <td>{{ climbingRoute.name }}</td>
                        <td>{{ climbingRoute.difficulty }} {{ climbingRoute.difficultySign }}</td>
                        <td>{{ climbingRoute.location }}</td>
                        <td>{{ climbingRoute.type }}</td>
                        <td>{{ climbingRoute.comment }}</td>
                        <td>{{ climbingRoute.creators.join(',') }}</td>
                        <td>{{ formatDate(climbingRoute.screwDate) }}</td>
                        <td><RouteDetails :routeId="climbingRoute.id"></RouteDetails></td>
                        </tr>
                    </template>
                </v-data-table>
            </v-container>
        </v-main>
    </v-app>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from '#imports';
import { getAllClimbingRoutes } from '@/services/climbingRoutes';
import RouteDetails from '@/components/RouteDetails.vue';

export default {
    components: {
        RouteDetails
    },

    setup() {
        useHead({
            title: 'Climbing Routes - Verti-Grade',
            meta: [
                {
                    name: 'description',
                    content: 'Climbing Routes',
                },
            ],
        });

        const { t } = useI18n();
        const climbingRoutes = ref([]);
        const selectedDifficulty = ref('');
        const selectedLocation = ref('');
        const searchRouteName = ref('');

        const headers = ref([
            { title: t('climbing.color'), value: 'color' },
            { title: t('climbing.routename'), value: 'name' },
            { title: t('climbing.difficulty'), value: 'difficulty' },
            { title: t('climbing.location'), value: 'location' },
            { title: t('climbing.type'), value: 'type' },
            { title: t('climbing.comment'), value: 'comment' },
            { title: t('climbing.creators'), value: 'creators' },
            { title: t('table.created_at'), value: 'screwDate' },
            { title: t('table.actions'), value: 'actions' },
        ]);

        const difficulties = ref([
            { text: t('filter.all'), value: '' },
            { text: '1', value: '1' },
            { text: '2', value: '2' },
            { text: '3', value: '3' },
            { text: '4', value: '4' },
            { text: '5', value: '5' },
            { text: '6', value: '6' },
            { text: '7', value: '7' },
            { text: '8', value: '8' },
            { text: '9', value: '9' },
            { text: '10', value: '10' },
        ]);

        const locations = ref([
            { text: t('filter.all'), value: '' },
            { text: 'Hanau', value: 'Hanau' },
            { text: 'Gelnhausen', value: 'Gelnhausen' }
        ]);

        const formatDate = (date) => {
            if (!date) return null;
            const d = new Date(date);
            let day = '' + d.getDate(),
                month = '' + (d.getMonth() + 1),
                year = d.getFullYear();

            if (day.length < 2) day = '0' + day;
            if (month.length < 2) month = '0' + month;

            return [day, month, year].join('.');
        };

        const filteredClimbingRoutes = computed(() => {
            let filteredRoutes = climbingRoutes.value.filter(route => !route.archived);

            if (selectedDifficulty.value) {
                const selectedDifficultyInt = parseInt(selectedDifficulty.value);
                filteredRoutes = filteredRoutes.filter(route => parseInt(route.difficulty) === selectedDifficultyInt);
            }
            if (selectedLocation.value) {
                filteredRoutes = filteredRoutes.filter(route => route.location === selectedLocation.value);
            }
            if (searchRouteName.value) {
                filteredRoutes = filteredRoutes.filter(route => route.name.toLowerCase().includes(searchRouteName.value.toLowerCase()));
            }

            return filteredRoutes;
        });

        onMounted(async () => {
            try {
                climbingRoutes.value = await getAllClimbingRoutes();
            } catch (error) {
                console.error('Error loading climbing routes:', error);
            }
        });

        return {
            climbingRoutes,
            selectedDifficulty,
            selectedLocation,
            searchRouteName,
            headers,
            difficulties,
            locations,
            formatDate,
            filteredClimbingRoutes
        };     
    }
}

</script>