<template>
    <div class="view-ratings-wrapper">
        <!-- The button that opens the ratings sheet -->
        <v-btn 
            @click="openSheet" 
            color="primary"
        >
            {{ $t('ratings.ratings') }}
        </v-btn>

        <!-- 
            The v-bottom-sheet provides a native mobile experience by sliding up from the bottom.
            On desktop, it behaves like a standard centered dialog.
        -->
        <v-bottom-sheet v-model="isSheetOpen" inset>
            <v-card class="d-flex flex-column" style="max-height: 90vh;">
                <v-card-item class="py-2">
                    <v-card-title class="text-h5 text-center">
                        {{ $t('ratings.climber_reviews') }}
                    </v-card-title>
                    <template v-slot:append>
                        <v-btn icon @click="isSheetOpen = false" variant="text">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </template>
                </v-card-item>

                <v-progress-linear v-if="isLoading" indeterminate color="primary"></v-progress-linear>

                <v-card-text class="flex-grow-1" style="overflow-y: auto;">
                    <!-- List of Review Cards -->
                    <div v-if="!isLoading && ratings.length > 0">
                        <v-card 
                            v-for="(review, index) in ratings" 
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
                    <div v-if="!isLoading && ratings.length === 0" class="text-center pa-8">
                        <v-icon size="x-large" class="mb-4">mdi-comment-search-outline</v-icon>
                        <h3 class="text-h6 mb-2">{{ $t('ratings.no_reviews_yet') }}</h3>
                        <p class="text-body-1">{{ $t('ratings.be_the_first') }}</p>
                    </div>
                </v-card-text>
            </v-card>
        </v-bottom-sheet>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type PocketBase from 'pocketbase'
import type { RatingRecord } from '~/types/models'

const { t } = useI18n()

interface RatingDisplay {
    rating: number | null | undefined
    difficulty: string
    comment: string | null
}

type Unsubscribe = (() => void | Promise<void>) | null

const props = defineProps<{
    route_id: string
}>()

const pb = usePocketbase() as PocketBase

// Component State
const isSheetOpen = ref(false)
const isLoading = ref(false)
const ratings = ref<RatingDisplay[]>([])
const unsubscribe = ref<Unsubscribe>(null)

const openSheet = async () => {
    isSheetOpen.value = true
    await fetchClimbingRatings()
    await subscribeToRatings()
}

const fetchClimbingRatings = async () => {
    if (!props.route_id) {
        return
    }

    isLoading.value = true
    try {
        const data = await pb.collection('ratings').getFullList<RatingRecord>({
            filter: `route_id = "${props.route_id}"`,
            sort: '-created',
        })

        ratings.value = data.map((rating) => ({
            rating: typeof rating.rating === 'number' ? rating.rating : null,
            difficulty: buildDifficultyLabel(rating),
            comment: rating.comment ?? null,
        }))
    } catch (error) {
        console.error('Error fetching ratings:', error)
        ratings.value = []
    } finally {
        isLoading.value = false
    }
}

const subscribeToRatings = async () => {
    await unsubscribeFromRatings()

    try {
        unsubscribe.value = await pb.collection('ratings').subscribe('*', (e) => {
            if (e.record.route_id === props.route_id) {
                fetchClimbingRatings()
            }
        })
    } catch (error) {
        console.error('Failed to subscribe to ratings:', error)
    }
}

const unsubscribeFromRatings = async () => {
    if (unsubscribe.value) {
        await unsubscribe.value()
        unsubscribe.value = null
    }
}

watch(isSheetOpen, (isOpen) => {
    if (!isOpen) {
        void unsubscribeFromRatings()
    }
})

onBeforeUnmount(() => {
    void unsubscribeFromRatings()
})

function buildDifficultyLabel(rating: RatingRecord): string {
    const base = rating.difficulty ?? ''
    const sign = rating.difficulty_sign === true
        ? '+'
        : rating.difficulty_sign === false
            ? '-'
            : typeof rating.difficulty_sign === 'string'
                ? rating.difficulty_sign
                : ''

    return `${base}${sign}`.trim()
}
</script>

<style scoped>
</style>