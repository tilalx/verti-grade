<template>
    <v-container>
        <v-row>
            <v-col>
                <v-card class="mx-auto" outlined>
                    <v-card>
                        <v-card-actions :disabled="true">
                            <v-list>
                                <v-list-item>
                                    <span>{{ $t('account.name') }}:</span>
                                    <span class="ml-1">{{
                                        metadata?.name
                                    }}</span>
                                </v-list-item>
                                <v-list-item>
                                    <span
                                        >{{ $t('routes.route_setter') }}:</span
                                    >
                                    <span class="ml-1">{{
                                        metadata?.creator.join(', ')
                                    }}</span>
                                </v-list-item>
                                <v-list-item>
                                    <span>{{ $t('routes.screwed_at') }}:</span>
                                    <span class="ml-1">
                                        {{
                                            new Date(
                                                metadata?.screw_date,
                                            ).toLocaleDateString('de-DE')
                                        }}
                                    </span>
                                </v-list-item>
                            </v-list>
                        </v-card-actions>
                    </v-card>
                </v-card>
                <v-spacer class="my-4"></v-spacer>
                <CreateReview :route_id="route_id"></CreateReview>
                <v-spacer class="my-4"></v-spacer>
                <v-card class="mx-auto" outlined>
                    <v-data-table
                        :items="reviews"
                        :headers="headers"
                        :items-per-page="15"
                        class="elevation-1"
                    >
                        <template v-slot:[`item.rating`]="{ item }">
                            <v-rating
                                v-model="item.rating"
                                :readonly="true"
                                :half-increments="true"
                                :length="5"
                            ></v-rating>
                        </template>
                    </v-data-table>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
const route_id = ref(getRouteIdFromUrl())
const reviews = ref([])
const metadata = ref(null)

const headers = ref([
    { title: t('ratings.stars'), value: 'rating' },
    { title: t('ratings.difficulty'), value: 'difficulty' },
    { title: t('ratings.comment'), value: 'comment' },
])

function getRouteIdFromUrl() {
    const id = route.query.id
    return id
}

function formatDateToYYYYMMDD(date) {
    if (!date) return null
    const d = new Date(date)
    let month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear()

    if (month.length < 2) month = '0' + month
    if (day.length < 2) day = '0' + day

    return [year, month, day].join('-')
}

const getAllRouteRatings = async () => {
    const data = await pb.collection('ratings').getFullList({
        filter: `route_id = "${route_id.value}"`,
    })

    const ratings = data.map((rating) => {
        return {
            rating: rating.rating,
            difficulty:
                rating.difficulty +
                ' ' +
                (rating.difficulty_sign
                    ? '+'
                    : rating.difficulty_sign === false
                      ? '-'
                      : ''),
            comment: rating.comment,
        }
    })
    reviews.value = ratings
}

const fetchRouteMetadata = async () => {
    const record = await pb.collection('routes').getOne(route_id.value, {
        sort: '-created',
        expand: 'name, creator, screw_date',
    })

    metadata.value = record
}

const getRouteMetadata = async () => {
    try {
        await fetchRouteMetadata()
    } catch (error) {
        console.error(error)
        navigateTo('/404')
    }
}

pb.collection('ratings').subscribe(
    '*',
    function (e) {
        getAllRouteRatings()
    },
    {},
)

onMounted(() => {
    route_id.value = getRouteIdFromUrl()
    getRouteMetadata()
    getAllRouteRatings()
})
</script>
