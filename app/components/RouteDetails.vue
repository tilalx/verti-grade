<template>
    <v-container>
        <v-btn color="primary" @click="openDialog">{{ $t('ratings.ratings') }}</v-btn>
        <v-dialog v-model="dialog" persistent max-width="800px">
            <v-card>
                <v-card-title>
                    <v-btn icon @click="dialog = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>
                <v-card-text>
                    <v-data-table
                        :headers="headers"
                        :items="routeDetails"
                        :items-per-page="15"
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
                                <td>
                                    {{ item.difficulty }}
                                    {{
                                        item.difficulty_sign === true
                                            ? '+'
                                            : item.difficulty_sign === false
                                              ? '-'
                                              : null
                                    }}
                                </td>
                                <td>{{ item.comment }}</td>
                            </tr>
                        </template>
                    </v-data-table>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup>
import { ref } from 'vue'

const { t } = useI18n()

const props = defineProps({
    route_id: {
        type: String,
        required: true,
    },
})

const pb = usePocketbase()
const dialog = ref(false)
const routeDetails = ref([])
const headers = [
    { title: t('ratings.stars'), value: 'rating' },
    { title: t('ratings.difficulty'), value: 'difficulty' },
    { title: t('routes.comment'), value: 'comment' },
]

function openDialog() {
    dialog.value = true
    getClimbingRatings()
}

async function getClimbingRatings() {
    const ratings = await pb.collection('ratings').getFullList({
        filter: `route_id = "${props.route_id}"`,
        sort: '-created',
    })

    routeDetails.value = ratings
}
</script>
