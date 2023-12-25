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
                        <v-textarea v-model="routeData.comment" label="Route Comment" :counter="255" maxlength="255"></v-textarea>
                        <v-text-field v-model="routeData.creators" label="Route Creators split by ," required></v-text-field>
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
            difficultySign: ['','-', '+']
        };
    },
    computed: {
        isFormValid() {
            return this.routeData && this.routeData.name && this.routeData.difficulty && this.routeData.location && this.routeData.type && this.routeData.comment.length <= 255 && this.routeData.creators;
        }
    },
    methods: {
        openPopup() {
            getClimbingRouteById(this.routeId).then((response) => {
                this.routeData = response.data;
                this.routeData.creators = this.routeData.creators.join(',');
                this.popupOpen = true;
            });
        },
        closePopup() {
            this.popupOpen = false;
        },
        async saveChanges() {
            if (this.isFormValid) {
                console.log(this.routeData.creators);

                this.routeData.creators = this.routeData.creators.split(',');
                await updateClimbingRoute(this.routeData);
                this.closePopup();
            }
        }
    }
};
</script>
