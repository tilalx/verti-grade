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
import { getAllClimbingRoutes } from '@/services/climbingRoutes';
import RouteDetails from '@/components/RouteDetails.vue';
export default {
    name: 'DashBoard',
    components: { RouteDetails },
    data() {
        return {
            headers: [
                { title: this.$t('climbing.color'), value: 'color' },
                { title: this.$t('climbing.routename'), value: 'name' },
                { title: this.$t('climbing.difficulty'), value: 'difficulty' },
                { title: this.$t('climbing.location'), value: 'location' },
                { title: this.$t('climbing.type'), value: 'type' },
                { title: this.$t('climbing.comment'), value: 'comment' },
                { title: this.$t('climbing.creators'), value: 'creators' },
                { title: this.$t('table.created_at'), value: 'screwDate' },
                { title: this.$t('table.actions'), value: 'actions' },
            ],
            difficulties: [
                { text: this.$t('filter.all'), value: '' },
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
                { text: this.$t('filter.all'), value: '' },
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
    methods:{
        formatDate(date) {
            if (!date) return null;
            const d = new Date(date);
            let day = '' + d.getDate(),
                month = '' + (d.getMonth() + 1),
                year = d.getFullYear();

            if (day.length < 2) day = '0' + day;
            if (month.length < 2) month = '0' + month;

            return [day, month, year].join('.');
        },
    },
    computed: {
        filteredClimbingRoutes() {
            let filteredRoutes = this.climbingRoutes.filter(route => !route.archived);
            
            if (this.selectedDifficulty) {
                const selectedDifficultyInt = parseInt(this.selectedDifficulty);
                filteredRoutes = filteredRoutes.filter(route => parseInt(route.difficulty) === selectedDifficultyInt);
            }
            if (this.selectedLocation) {
                filteredRoutes = filteredRoutes.filter(route => route.location === this.selectedLocation);
            }
            if (this.searchRouteName) {
                filteredRoutes = filteredRoutes.filter(route => route.name.toLowerCase().includes(this.searchRouteName.toLowerCase()));
            }
            
            return filteredRoutes;
        },
    },
    mounted() {
        getAllClimbingRoutes().then(response => {
            this.climbingRoutes = response;
            this.loading = false;
        }).catch(error => {
            console.error('Error loading climbing routes:', error);
            this.loading = false;
        });
    },
};
</script>