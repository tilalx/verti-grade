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
          <CreateRoute @closed="reloadRoutes"></CreateRoute>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <h2>Import Route</h2>
          <ImportRoute @closed="reloadRoutes"></ImportRoute>
        </v-col>
      </v-row>
  
      <v-row>
        <v-col>
          <h2>All Climbing Routes:</h2>
          <v-row>
            <!-- Column for the Route Name search -->
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
            <v-col cols="6" sm="3">
              <v-checkbox
                label="Display Archived"
                v-model="displayArchived"
                class="mt-2"
              ></v-checkbox>
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
            </v-btn>
            <div class="mx-2"></div>
            <v-btn v-if="hasSelection" @click="exportSelectedExcel" color="success">
              <v-icon>mdi-file-excel</v-icon>
            </v-btn>
            <div class="mx-2"></div>
            <v-btn v-if="hasSelection" @click="exportSelectedJson" color="success">
              <v-icon>mdi-code-json</v-icon>
            </v-btn>
            <div class="mx-2"></div>
            <v-btn v-if="hasSelection" @click="deleteSelected" color="error">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
            <div class="mx-2"></div>
            <v-btn v-if="hasSelection" @click="archiveSelected" color="warning">
              <v-icon>mdi-archive</v-icon>
            </v-btn>
          </v-col>
          
          <v-data-table :headers="headers" :items="filteredClimbingRoutes">
            <template v-slot:[`item`]="{ item: climbingRoute }">
              <tr>
                <td>
                  <v-checkbox
                    v-model="climbingRoute.selected"
                    color="primary"
                    hide-details
                  ></v-checkbox>
                </td>
                <td>
                  <v-avatar :color="climbingRoute.color" size="30"></v-avatar>
                </td>
                <td>{{ climbingRoute.name }}</td>
                <td>{{ climbingRoute.difficulty }} {{ climbingRoute.difficultySign }}</td>
                <td>{{ climbingRoute.location }}</td>
                <td>{{ climbingRoute.type }}</td>
                <td>{{ climbingRoute.comment }}</td>
                <td>{{ climbingRoute.creators.join(',') }}</td>
                <td>{{ new Date(climbingRoute.screwDate).toLocaleDateString('de-DE') }}</td>
                <td>{{ climbingRoute.archived }}</td>
                <td><EditRoute @closed="reloadRoutes" :routeId="climbingRoute.id"></EditRoute></td>
              </tr>
            </template>
          </v-data-table>
  
          <div v-if="hasSelection" class="selection-info">
            Selection: {{ selectedCount }} routes selected.
          </div>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  

<script>
import { getAllClimbingRoutes, printClimbingRoute, exportXlsx, exportJson , deleteClimbingRoute, archiveClimbingRoute } from '@/services/climbingRoutes';
import CreateRoute from '@/components/CreateRoute.vue';
import EditRoute from '@/components/EditRoute.vue';
import ImportRoute from '@/components/ImportRoute.vue';
export default {
    name: 'DashBoard',
    components: { CreateRoute, EditRoute, ImportRoute },
    data() {
        return {
            routes: [],
            climbingRoutes: [],
            selectedDifficulty: '',
            selectedLocation: '',
            searchRouteName: '',
            selected: [],
            displayArchived: false,
            headers: [
                { title: this.$t('table.select'), value: 'selected' },
                { title: this.$t('climbing.color'), value: 'color' },
                { title: this.$t('climbing.routename'), value: 'name' },
                { title: this.$t('climbing.difficulty'), value: 'difficulty' },
                { title: this.$t('climbing.location'), value: 'location' },
                { title: this.$t('climbing.type'), value: 'type' },
                { title: this.$t('climbing.comment'), value: 'comment' },
                { title: this.$t('climbing.creators'), value: 'creators' },
                { title: this.$t('table.created_at'), value: 'screwDate' },
                { title: this.$t('climbing.archived'), value: 'archived' },
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
            if (this.searchRouteName) {
                filteredRoutes = filteredRoutes.filter(route => route.name.toLowerCase().includes(this.searchRouteName.toLowerCase()));
            }
            if (!this.displayArchived) {
                filteredRoutes = filteredRoutes.filter(route => !route.archived);
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
        async reloadRoutes() {
            this.climbingRoutes = await getAllClimbingRoutes();
            this.climbingRoutes.forEach(route => {
                route.selected = false;
            });
        },
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
                const currentDate = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
                link.download = `climbing-routes-${currentDate}.pdf`; 
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

            } catch (error) {
                console.error('Error in printSelected:', error);
            }
        },
        async exportSelectedExcel() {
            const selectedRoutes = this.filteredClimbingRoutes.filter(route => route.selected);
            const selectedRouteIds = selectedRoutes.map(route => route.id).join(',');

            try {
                const excelBlob = await exportXlsx(selectedRouteIds);  // Fetch the Excel file as a blob
                const blob = new Blob([excelBlob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                const currentDate = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
                link.download = `climbing-routes-${currentDate}.xlsx`; 
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

            } catch (error) {
                console.error('Error in exportSelectedAsExcel:', error);
            }
        },
        async exportSelectedJson(){
            const selectedRoutes = this.filteredClimbingRoutes.filter(route => route.selected);
            const selectedRouteIds = selectedRoutes.map(route => route.id).join(',');

            try {
                const jsonBlob = await exportJson(selectedRouteIds);  // Fetch the Excel file as a blob
                const blob = new Blob([jsonBlob], { type: 'application/json' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                const currentDate = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
                link.download = `climbing-routes-${currentDate}.json`; 
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

            } catch (error) {
                console.error('Error in exportSelectedAsJson:', error);
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
            this.reloadRoutes();
        },
        async archiveSelected() {
            const selectedRoutes = this.filteredClimbingRoutes.filter(route => route.selected);
            const selectedRouteIds = selectedRoutes.map(route => route.id).join(',');

            try {
                await archiveClimbingRoute(selectedRouteIds);
                await this.getAllClimbingRoutes();
            } catch (error) {
                console.error('Error in archiveSelected:', error);
            }
            this.reloadRoutes();
        }
    }
};
</script>

<style scoped>
</style>