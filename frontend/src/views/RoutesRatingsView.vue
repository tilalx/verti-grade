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
                <v-data-table>
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th>{{ $t('climbing.routename') }}</th>
                                <th>{{ $t('climbing.difficulty') }}</th>
                                <th>{{ $t('climbing.location') }}</th>
                                <th>{{ $t('climbing.type') }}</th>
                                <th>{{ $t('climbing.comment') }}</th>
                                <th>{{ $t('climbing.creators') }}</th>
                                <th>{{ $t('table.created_at') }}</th>
                                <th>{{ $t('table.actions') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="climbingRoute in climbingRoutes" :key="climbingRoute.id">
                                <td>{{ climbingRoute.name }}</td>
                                <td>{{ climbingRoute.difficulty }} {{ climbingRoute.difficultySign }}</td>
                                <td>{{ climbingRoute.location }}</td>
                                <td>{{ climbingRoute.type }}</td>
                                <td>{{ climbingRoute.comment }}</td>
                                <td>{{ climbingRoute.creators.join(',') }}</td>
                                <td>{{ climbingRoute.createdAt }}</td>
                                <td><RouteDetails :routeId=climbingRoute.id></RouteDetails></td>
                            </tr>
                        </tbody>
                    </template>
                </v-data-table>
            </v-container>
        </v-main>
    </v-app>
</template>

<script>
import { getAllClimbingRoutes } from '@/services/climbingRoutes';
import RouteDetails from '@/components/RouteDetails.vue';
export default {
    name: 'DashBoard',
    components: { RouteDetails },
    data() {
        return {
            headers: [
                { title: 'Name', value: 'name' },
                { title: 'Difficulty', value: 'difficulty' },
                { title: 'Location', value: 'location' },
                { title: 'Type', value: 'type' },
                { title: 'Comment', value: 'comment' },
                { title: 'Created At', value: 'createdAt' },
                { title: 'Actions', value: 'actions', sortable: false}
            ],
            difficulties: [
                { text: 'All', value: '' },
                { text: '1', value: '1' },
                { text: '2', value: '2' },
                { text: '3', value: '3' },
                { text: '4', value: '4' },
                { text: '5', value: '5' },
                { text: '6', value: '6' },
                { text: '7', value: '7' },
                { text: '8', value: '8' },
                { text: '9', value: '9' },
                { text: '10', value: '10' }
            ],
            locations: [
                { text: 'All', value: '' },
                { text: 'Hanau', value: 'Hanau' },
                { text: 'Gelnhausen', value: 'Gelnhausen' }
            ],
            search: '',
            climbingRoutes: [],
            selectedDifficulty: '',
            selectedLocation: '',
            searchRouteName: '',
            loading: true,
            pagination: {},
        };
    },
    computed: {
        filteredClimbingRoutes() {
            let filteredRoutes = this.climbingRoutes;
            if (this.selectedDifficulty) {
              const selectedDifficultyInt = parseInt(this.selectedDifficulty);
              filteredRoutes = filteredRoutes.filter(route => parseInt(route.difficulty) === selectedDifficultyInt);
            }
            if (this.selectedLocation) {
                filteredRoutes = filteredRoutes.filter(route => route.location === this.selectedLocation);
            }
            if (this.searchRouteName) { // Added search filter for route name
                filteredRoutes = filteredRoutes.filter(route => route.name.toLowerCase().includes(this.searchRouteName.toLowerCase()));
            }
            return filteredRoutes;
        },
    },
    mounted() {
        getAllClimbingRoutes().then(response => {
            this.climbingRoutes = response;
        });
        this.loading = false;

    },
};
</script>
