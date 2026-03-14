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
                        <v-list-item :title="formattedAnchorPoint">
                            <template v-slot:prepend>
                                <v-icon color="grey-darken-1">mdi-pound</v-icon>
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

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useHead, useI18n } from '#imports'
import { navigateTo } from 'nuxt/app'
import type PocketBase from 'pocketbase'
import type { RatingRecord, RouteListItem, RouteRecord } from '~/types/models'
import CreateReview from '@/components/CreateReview.vue'

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

interface ReviewDisplay {
    rating: number | null | undefined
    difficulty: string
    comment: string | null
}

const pb = usePocketbase() as PocketBase
const route = useRoute()
const route_id = ref<string | null>((route.query.id as string) || null)
const reviews = ref<ReviewDisplay[]>([])
const metadata = ref<RouteListItem | null>(null)
let unsubscribe: (() => void | Promise<void>) | null = null

const formattedAnchorPoint = computed(() => {
    if (!metadata.value) return ''
    const value = metadata.value.anchor_point
    const anchorValue = value === null || value === undefined || value === '' ? '—' : value
    return `${t('climbing.anchor_point')}: ${anchorValue}`
})

const formattedScrewDate = computed(() => {
    if (!metadata.value?.screw_date) return ''
    try {
        return new Date(metadata.value.screw_date).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    } catch (error) {
        return ''
    }
})

const getAllRouteRatings = async (): Promise<void> => {
    if (!route_id.value) return
    try {
        const data = await pb.collection('ratings').getFullList<RatingRecord>({
            filter: `route_id = "${route_id.value}"`,
            sort: '-created',
        })

        reviews.value = data.map((rating) => ({
            rating: typeof rating.rating === 'number' ? rating.rating : null,
            difficulty: buildDifficultyLabel(rating),
            comment: rating.comment ?? null,
        }))
    } catch (error) {
        console.error('Error fetching ratings:', error)
    }
}

const getRouteMetadata = async (): Promise<void> => {
    if (!route_id.value) {
        navigateTo('/404')
        return
    }

    try {
        const record = await pb.collection('routes').getOne<RouteRecord>(route_id.value)
        metadata.value = {
            ...record,
            creator: normalizeCreators(record.creator),
        }
    } catch (error) {
        console.error('Error fetching route metadata:', error)
        navigateTo('/404')
    }
}

onMounted(async () => {
    if (route_id.value) {
        await Promise.all([getRouteMetadata(), getAllRouteRatings()])
        unsubscribe = await pb.collection('ratings').subscribe('*', (event) => {
            if (event.record.route_id === route_id.value) {
                void getAllRouteRatings()
            }
        })
    } else {
        console.warn('No route ID found in URL.')
        navigateTo('/404')
    }
})

onBeforeUnmount(async () => {
    if (unsubscribe) {
        await unsubscribe()
        unsubscribe = null
    }
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

function normalizeCreators(raw: RouteRecord['creator']): string[] {
    if (Array.isArray(raw)) {
        return raw
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter(Boolean)
    }

    if (typeof raw === 'string') {
        return raw
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
    }

    return []
}
</script>

<style scoped>
</style>