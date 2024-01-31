<template>
  <v-container>
      <CreateReview :routeId="routeId"></CreateReview>
      <v-row>
        <v-col>
          <v-card class="mx-auto" outlined>
            <v-toolbar color="primary" >
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


<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from '#imports';
import CreateReview from '@/components/CreateReview.vue';
import { getRouteRatingsByClimbingRouteId } from '@/services/routeRating.js';
import { getClimbingRouteById } from '@/services/climbingRoutes.js';

useHead({
    title: 'Route Reviews',
    meta: [
        {
            name: 'description',
            content: 'Route Reviews',
        },
    ],
});

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const routeId = ref(getRouteIdFromUrl());
const reviews = ref([]);
const routeData = ref(null);

const headers = ref([
    { title: t('ratings.stars'), value: 'rating' },
    { title: t('ratings.difficulty'), value: 'difficulty' },
    { title: t('ratings.difficultySign'), value: 'difficultySign' },
    { title: t('ratings.comment'), value: 'comment' },
]);

function getRouteIdFromUrl() {
    const id = route.query.id;
    return Number(id);
}

async function getAllRouteRatings() {
    try {
        const routeResponse = await getClimbingRouteById(routeId.value);
        routeData.value = routeResponse.data;

        const reviewResponse = await getRouteRatingsByClimbingRouteId(routeId.value);
        reviews.value = reviewResponse.data;
    } catch (error) {
        console.error('Error fetching route details:', error);
        router.push('/');
    }
}

onMounted(() => {
    routeId.value = getRouteIdFromUrl();
    getAllRouteRatings();
});
</script>
