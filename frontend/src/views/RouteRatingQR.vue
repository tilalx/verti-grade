<template>
    <v-container>
      <CreateReview :routeId="routeId"></CreateReview>
      <v-row>
        <v-col>
          <v-card class="mx-auto" outlined>
            <v-toolbar color="deep-purple accent-3" dark flat>
              <v-toolbar-title>{{ $t('header.routereviews') }}</v-toolbar-title>
            </v-toolbar>
            <v-data-table :items="reviews" :headers="headers" class="elevation-1">
              <template v-slot:[`item.rating`]="{ item }">
                <v-rating v-model="item.rating" :readonly="true" :half-increments="true" :length="5" color="amber"></v-rating>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </template>
  

<script>
import CreateReview from "@/components/CreateReview.vue";
import { getRouteRatingsByClimbingRouteId } from "@/services/routeRating.js";
import { getClimbingRouteById } from "@/services/climbingRoutes.js";
export default {
    name: "RouteRatingQR",
    components: {
        CreateReview,
    },
    data() {
        return {
            routeId: null,
            reviews: null,
            headers: [
              { title: this.$t('ratings.stars'), value: "rating" },
              { title: this.$t('ratings.difficulty'), value: "difficulty" },
              { title: this.$t('ratings.difficultySign'), value: "difficultySign" },
              { title: this.$t('ratings.comment'), value: "comment" },
            ],
        };
    },
    created() {
        this.routeId = this.getRouteIdFromUrl();
        this.reviews = this.getAllRouteRatings();
    },
    methods: {
        getRouteIdFromUrl() {
            const url = window.location.href;
            const parts = url.split("/");
            const id = parts[parts.length - 1];
            return Number(id); // Convert string to number
        },
        getAllRouteRatings() {
            getClimbingRouteById(this.routeId)
                .then((response) => {
                    this.routeData = response.data;
                })
                .catch((error) => {
                    console.error("Error fetching route details:", error);
                    this.$router.push('/'); // Push user to /404 page
                });
            getRouteRatingsByClimbingRouteId(this.routeId)
                .then((response) => {
                    this.reviews = response.data;
                })
                .catch((error) => {
                    console.error("Error fetching route details:", error);
                });
        },
    },
};
</script>
