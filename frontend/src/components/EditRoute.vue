<template>
    <div>
        <v-btn @click="openPopup">Edit Route</v-btn>
        <v-dialog v-model="popupOpen" max-width="500px">
            <v-card>
                <v-card-title>Edit Route</v-card-title>
                <v-card-text v-if="routeData">
                    <v-form @submit.prevent="saveChanges">
                        <v-text-field v-model="routeData.name" label="Route Name" required></v-text-field>
                        <v-select v-model="routeData.difficulty" label="Route Difficulty" :items="difficulty" required></v-select>
                        <v-select v-model="routeData.difficultySign" label="Route Difficulty Sign" :items="difficultySign" allow-numeric required></v-select>
                        <v-select v-model="routeData.location" label="Route Location" :items="locations" required></v-select>
                        <v-select v-model="routeData.type" label="Route Type" :items="Type" required></v-select>
                        <v-textarea v-model="routeData.comment" label="Route Comment"></v-textarea>
                        <v-text-field v-model="routeData.creators" label="Route Creators split by ," required></v-text-field>
                        <v-text-field v-model="routeData.screwDate" label="Screw Date" type="date" required></v-text-field>
                        <v-switch v-model="routeData.archived" label="Archived" required :true-value="true" :false-value="false"></v-switch>
                        <div class="color-picker-container">
                            <v-color-picker v-model="routeData.color" :modes="['hexa']" label="Route Color" required></v-color-picker>
                        </div>
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-btn color="primary" type="submit" @click="saveChanges" :disabled="!isFormValid">Save</v-btn>
                    <v-btn @click="closePopup">Cancel</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import { getClimbingRouteById, updateClimbingRoute } from '@/services/climbingRoutes';

function formatDateToYYYYMMDD(date) {
    if (!date) return null;
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}


export default {
    props: {
        routeId: {
            type: Number,
            required: true
        }
    },
    data() {
        return {
            popupOpen: false,
            routeData: null,
            locations: ['Hanau', 'Gelnhausen'],
            Type: ['Boulder', 'Route'],
            difficulty: Array.from({ length: 10 }, (_, i) => (i + 1).toString()),
            difficultySign: ['','-', '+'],
            
        };
    },
    computed: {
        isFormValid() {
            return this.routeData && this.routeData.name && this.routeData.difficulty && this.routeData.location && this.routeData.type && this.routeData.creators && this.routeData.screwDate && this.routeData.archived !== null && this.routeData.color;
        }
    },
    methods: {
        openPopup() {
            getClimbingRouteById(this.routeId).then((response) => {
                response.data.screwDate = formatDateToYYYYMMDD(response.data.screwDate);
                this.routeData = response.data;
                this.routeData.creators = this.routeData.creators.join(',');
                this.popupOpen = true;
            });
        },
        closePopup() {
            this.popupOpen = false;
            this.$emit('closed');
        },
        async saveChanges() {
            if (this.isFormValid) {
                // Ensure the date is formatted correctly before sending
                this.routeData.screwDate = formatDateToYYYYMMDD(this.routeData.screwDate);
                
                this.routeData.creators = this.routeData.creators.split(',');
                await updateClimbingRoute(this.routeData);
                this.closePopup();
            }
        }
    }
};
</script>

<style scoped>
.color-picker-container {
  display: flex;
  justify-content: center;
  align-items: center; /* Optional, if you also want vertical centering */
  height: 100%; /* Adjust as needed */
}
</style>