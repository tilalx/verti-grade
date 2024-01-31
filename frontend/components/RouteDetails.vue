<template>
    <v-container>
      <v-btn color="primary" @click="openDialog">Ratiings</v-btn>
      <v-dialog v-model="dialog" persistent max-width="800px">
        <v-card>
          <v-card-title>
            Route Details
            <v-spacer></v-spacer>
            <v-btn icon @click="dialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="routeDetails"
              :items-per-page="5"
              class="elevation-1"
            >
              <template v-slot:item="{ item }">
                <tr>
                  <td>
                    <v-rating
                      v-model="item.rating"
                      :max="5"
                      :half-increments="true"
                      :readonly="true"
                    ></v-rating>
                  </td>
                  <td>{{ item.difficulty }}</td>
                  <td>{{ item.difficultySign }}</td>
                  <td>{{ item.comment }}</td>
                </tr>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-container>
  </template>

<script>
import { getRouteRatingsByClimbingRouteId } from '@/services/routeRating.js'

export default {
    name: 'RouteDetails',
    props: {
        routeId: {
            type: Number,
            required: true
        }
    },
    data: () => ({
        dialog: false,
        routeDetails: [],
        headers: [
            { title: 'Rating', value: 'rating' },
            { title: 'Difficulty', value: 'difficulty' },
            { title: 'Difficulty Sign', value: 'difficultySign' },
            { title: 'Comment', value: 'comment' }
        ],
        search: ''
    }),
    methods: {
        openDialog() {
            this.dialog = true;
            this.getAllRouteRatings();
        },
        async getAllRouteRatings() {
            try {
                const response = await getRouteRatingsByClimbingRouteId(this.routeId);
                if (Array.isArray(response.data)) {
                    this.routeDetails = response.data; // Make sure this is the array of route details.
                } else {
                    console.error('Expected an array of route details, but got:', response.data);
                }
            } catch (error) {
                console.error('Error fetching route details:', error);
            }
        }
    },
};
</script>


<style scoped>
/* Add styles here if needed */
</style>
