<template>
    <v-container class="dashboard">
      <v-row>
        <v-col>
          <h1>Welcome to the Dashboard!</h1>
        </v-col>
      </v-row>
  
      <v-row>
        <v-col>
          <h2>Create Route</h2>
          <CreateRoute></CreateRoute>
        </v-col>
      </v-row>
  
      <v-row>
        <v-col>
          <h2>All Climbing Routes:</h2>
          <v-row>
            <!-- Column for the Route Name search -->
            <v-col cols="6" sm="3">
              <v-text-field
                label="Search Route Name"
                v-model="searchRouteName"
                class="mt-2"
              ></v-text-field>
            </v-col>
            <v-col cols="6" sm="3">
              <v-select
                label="Difficulty"
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
                label="Location"
                :items="locations"
                v-model="selectedLocation"
                item-title="text"
                item-value="value"
                class="mt-2"
              ></v-select>
            </v-col>
          </v-row>
          <v-col cols="12" sm="6" class="d-flex align-center">
            <!-- Select All Button -->
            <v-btn @click="selectAll" color="primary">
              <v-icon>{{ areAllSelected() ? 'mdi-checkbox-marked-outline' : 'mdi-checkbox-blank-outline' }}</v-icon>
              {{ areAllSelected() ? 'Deselect All' : 'Select All' }}
            </v-btn>
            <div class="mx-2"></div> 
            <v-btn v-if="hasSelection" @click="printSelected" color="success">
              <v-icon>mdi-printer</v-icon>
              Print Label
            </v-btn>
            <div class="mx-2"></div>
            <v-btn v-if="hasSelection" @click="deleteSelected" color="error">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-col>
          
          <v-table>
            <template v-slot:default>
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Route Name</th>
                  <th>Difficulty</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Comment</th>
                  <th>Creators</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="climbingRoute in filteredClimbingRoutes" :key="climbingRoute.id">
                  <td><input type="checkbox" v-model="climbingRoute.selected"></td>
                  <td>{{ climbingRoute.name }}</td>
                  <td>{{ climbingRoute.difficulty }} {{ climbingRoute.difficultySign }}</td>
                  <td>{{ climbingRoute.location }}</td>
                  <td>{{ climbingRoute.type }}</td>
                  <td>{{ climbingRoute.comment }}</td>
                  <td>{{ climbingRoute.creators.join(',') }}</td>
                  <td><EditRoute :routeId=climbingRoute.id></EditRoute></td>
                </tr>
              </tbody>
            </template>
          </v-table>
  
          <div v-if="hasSelection" class="selection-info">
            Selection: {{ selectedCount }} routes selected.
          </div>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  

<script>
import { getAllClimbingRoutes, printClimbingRoute, deleteClimbingRoute } from '@/services/climbingRoutes';
import CreateRoute from '@/components/CreateRoute.vue';
import EditRoute from '@/components/EditRoute.vue';
export default {
    name: 'DashBoard',
    components: { CreateRoute, EditRoute },
    data() {
        return {
            routes: [],
            climbingRoutes: [],
            selectedDifficulty: '',
            selectedLocation: '',
            searchRouteName: '', // Added searchRouteName data property
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
        };

    },
    async created() {
        this.routes = this.$router.options.routes;
        this.climbingRoutes = await getAllClimbingRoutes();
        this.climbingRoutes.forEach(route => {
            route.selected = false;
        });
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
        hasSelection() {
            return this.selectedCount > 0;
        },
        selectedCount() {
            return this.filteredClimbingRoutes.filter(route => route.selected).length;
        },
        selectedDifficultyValue() {
            return this.selectedDifficulty;
        },
        selectedLocationValue() {
            return this.selectedLocation;
        }
    },
    methods: {
        selectAll() {
            if (this.areAllSelected()) {
                this.deselectAll();
            } else {
                this.selectAllRoutes();
            }
        },
        areAllSelected() {
            return this.filteredClimbingRoutes.every(route => route.selected);
        },
        deselectAll() {
            this.filteredClimbingRoutes.forEach(route => {
                route.selected = false;
            });
        },
        selectAllRoutes() {
            this.filteredClimbingRoutes.forEach(route => {
                route.selected = true;
            });
        },
        async printSelected() {
            const selectedRoutes = this.filteredClimbingRoutes.filter(route => route.selected);
            const selectedRouteIds = selectedRoutes.map(route => route.id).join(',');

            try {
                const pdfBlob = await printClimbingRoute(selectedRouteIds);  // Fetch the PDF as a blob
                const blob = new Blob([pdfBlob], { type: 'application/pdf' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = 'climbing-routes.pdf'; 
                document.body.appendChild(link); 
                link.click();
                document.body.removeChild(link);

            } catch (error) {
                console.error('Error in printSelected:', error);
            }
        },
        async deleteSelected() {
            const selectedRoutes = this.filteredClimbingRoutes.filter(route => route.selected);
            const selectedRouteIds = selectedRoutes.map(route => route.id).join(',');

            try {
                await deleteClimbingRoute(selectedRouteIds);
                await this.getAllClimbingRoutes();
            } catch (error) {
                console.error('Error in deleteSelected:', error);
            }
        }
    }
};
</script>

<style scoped>
</style>