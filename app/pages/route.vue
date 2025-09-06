<template>
    <v-container>
        <v-row justify="center">
            <v-col cols="12" md="10" lg="8">
                <!-- Route Metadata Card -->
                <v-card class="mb-6" variant="outlined">
                    <v-card-title class="text-h5 text-primary">
                        {{ metadata?.name }}
                    </v-card-title>
                    <v-list density="compact">
                        <v-list-item :title="metadata?.creator.join(', ')">
                            <template v-slot:prepend>
                                <v-icon color="grey-darken-1">mdi-account-hard-hat</v-icon>
                            </template>
                        </v-list-item>
                        <v-list-item :title="formattedScrewDate">
                            <template v-slot:prepend>
                                <v-icon color="grey-darken-1">mdi-calendar-month</v-icon>
                            </template>
                        </v-list-item>
                    </v-list>
                </v-card>

                <!-- Create Review Action -->
                <CreateReview :route_id="route_id" :call-to-action="true" class="mb-6"></CreateReview>

                <!-- Reviews Section -->
                <div v-if="reviews.length > 0">
                    <v-card 
                        v-for="(review, index) in reviews" 
                        :key="index" 
                        class="mb-4"
                        variant="tonal"
                    >
                        <v-list-item class="py-2">
                             <!-- Placeholder for user avatar -->
                            <template v-slot:prepend>
                                <v-avatar color="grey-lighten-2">
                                    <v-icon>mdi-account</v-icon>
                                </v-avatar>
                            </template>

                            <v-list-item-title class="font-weight-bold">
                                {{ review.difficulty }}
                            </v-list-item-title>
                            
                            <v-rating
                                :model-value="review.rating"
                                readonly
                                color="yellow-darken-2"
                                density="compact"
                                size="small"
                                class="mt-1"
                            ></v-rating>
                        </v-list-item>
                        
                        <v-card-text v-if="review.comment" class="pt-0">
                                {{ review.comment }}
                        </v-card-text>
                    </v-card>
                </div>
                
                <!-- Empty State for No Reviews -->
                <v-card v-else class="text-center pa-8" variant="tonal">
                    <v-icon size="x-large" class="mb-4">mdi-comment-search-outline</v-icon>
                    <h3 class="text-h6 mb-2">{{ $t('ratings.no_reviews_yet') }}</h3>
                    <p class="text-body-1">{{ $t('ratings.be_the_first') }}</p>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '#imports'
import CreateReview from '@/components/CreateReview.vue'
import { navigateTo } from 'nuxt/app'

const { t } = useI18n()

useHead({
    title: t('page.title.route'),
    meta: [
        {
            name: 'description',
            content: t('page.content.route'),
        },
    ],
})

const pb = usePocketbase()
const route = useRoute()
const route_id = ref(route.query.id || null)
const reviews = ref([])
const metadata = ref(null)

// Computed property for safely formatting the date
const formattedScrewDate = computed(() => {
    if (!metadata.value?.screw_date) return ''
    try {
        return new Date(metadata.value.screw_date).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return ''
    }
})

const getAllRouteRatings = async () => {
    if (!route_id.value) return;
    try {
        const data = await pb.collection('ratings').getFullList({
            filter: `route_id = "${route_id.value}"`,
            sort: '-created' // Show newest reviews first
        });

        reviews.value = data.map((rating) => {
            let difficultySign = '';
            if (rating.difficulty_sign === true) {
                difficultySign = '+';
            } else if (rating.difficulty_sign === false) {
                difficultySign = '-';
            }
            return {
                rating: rating.rating,
                difficulty: `${rating.difficulty}${difficultySign}`,
                comment: rating.comment,
            };
        });
    } catch (error) {
        console.error("Error fetching ratings:", error);
    }
}

const getRouteMetadata = async () => {
    if (!route_id.value) {
        navigateTo('/404');
        return;
    }
    try {
        metadata.value = await pb.collection('routes').getOne(route_id.value);
    } catch (error) {
        console.error("Error fetching route metadata:", error);
        navigateTo('/404');
    }
}

// Subscribe to real-time updates
pb.collection('ratings').subscribe('*', (e) => {
    if (e.record.route_id === route_id.value) {
        getAllRouteRatings();
    }
});

onMounted(() => {
    if (route_id.value) {
        getRouteMetadata();
        getAllRouteRatings();
    } else {
        console.warn("No route ID found in URL.");
        navigateTo('/404');
    }
})
</script>

<style scoped>
</style>