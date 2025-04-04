<template>
    <v-app>
        <v-main>
            <v-container>
                <v-row>
                    <v-col cols="6" sm="3">
                        <v-text-field
                            :id="routeNameId"
                            :label="$t('climbing.searchRouteName')"
                            v-model="searchRouteName"
                            class="mt-2"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-select
                            :id="difficultyId"
                            :label="$t('climbing.difficulty')"
                            :items="difficulties"
                            v-model="selectedDifficulty"
                            item-title="text"
                            item-value="value"
                            class="mt-2"
                        ></v-select>
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-select
                            :id="typeId"
                            :label="$t('climbing.type')"
                            :items="types"
                            v-model="selectedType"
                            item-title="text"
                            item-value="value"
                            class="mt-2"
                        ></v-select>
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-select
                            :id="locationId"
                            :label="$t('climbing.location')"
                            :items="locations"
                            v-model="selectedLocation"
                            item-title="text"
                            item-value="value"
                            class="mt-2"
                        ></v-select>
                    </v-col>
                </v-row>
                <v-data-table
                    :headers="headers"
                    :items="filteredClimbingRoutes"
                    :items-per-page="50"
                    item-key="id"
                >
                    <template v-slot:[`item`]="{ item: climbingRoute }">
                        <tr>
                            <td>
                                <v-avatar
                                    :color="climbingRoute.color"
                                    size="30"
                                ></v-avatar>
                            </td>
                            <td>{{ climbingRoute.name }}</td>
                            <td>
                                {{ climbingRoute.difficulty }}
                                {{
                                    climbingRoute.difficulty_sign
                                        ? '+'
                                        : climbingRoute.difficulty_sign ===
                                            false
                                          ? '-'
                                          : null
                                }}
                            </td>
                            <td>{{ climbingRoute.comment }}</td>
                            <td>
                                <div class="d-flex ga-1">
                                    <v-chip
                                        v-for="creator in climbingRoute.creator"
                                        :key="creator"
                                        size="small"
                                    >
                                        {{ creator }}
                                    </v-chip>
                                </div>
                            </td>
                            <td>{{ formatDate(climbingRoute.screw_date) }}</td>
                            <td>
                                <RouteDetails
                                    :route_id="climbingRoute.id"
                                ></RouteDetails>
                            </td>
                        </tr>
                    </template>
                </v-data-table>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup>
const { t } = useI18n()

useHead({
    title: t('page.title.index'),
    meta: [
        {
            name: 'description',
            content: t('page.content.index'),
            authRequired: false,
        },
    ],
})

const routeNameId = useId()
const difficultyId = useId()
const typeId = useId()
const locationId = useId()

const pb = usePocketbase()
const climbingRoutes = ref([])
const selectedDifficulty = ref('')
const selectedLocation = ref('')
const selectedType = ref('')
const searchRouteName = ref('')

const headers = ref([
    { title: t('climbing.color'), value: 'color' },
    { title: t('climbing.routename'), value: 'name' },
    { title: t('climbing.difficulty'), value: 'difficulty' },
    { title: t('climbing.comment'), value: 'comment' },
    { title: t('climbing.creators'), value: 'creator' },
    { title: t('table.created_at'), value: 'screw_date' },
    { title: t('table.actions'), value: 'actions' },
])

const difficulties = ref([
    { text: t('filter.all'), value: '' },
    { text: '1', value: '1' },
    { text: '2', value: '2' },
    { text: '3', value: '3' },
    { text: '4', value: '4' },
    { text: '5', value: '5' },
    { text: '6', value: '6' },
    { text: '7', value: '7' },
    { text: '8', value: '8' },
    { text: '9', value: '9' },
    { text: '10', value: '10' },
])

const locations = ref([
    { text: t('filter.all'), value: '' },
    { text: 'Hanau', value: 'Hanau' },
    { text: 'Gelnhausen', value: 'Gelnhausen' },
])

const types = ref([
    { text: t('filter.all'), value: '' },
    { text: t('routes.types.boulder'), value: 'Boulder' },
    { text: t('routes.types.route'), value: 'Route' },
])

const fetchClimbingRoutes = async () => {
    const records = await pb.collection('routes').getFullList({
        sort: '-screw_date',
    })

    climbingRoutes.value = records
    climbingRoutes.value.forEach((route) => {
        route.selected = false
    })
}

const getClimbingRoutes = async () => {
    pb.collection('routes').subscribe('*', function () {
        getClimbingRoutes()
    })
}

await fetchClimbingRoutes()

onMounted(() => {
    getClimbingRoutes()
})

const formatDate = (date) => {
    if (!date) return null
    const d = new Date(date)
    let day = '' + d.getDate(),
        month = '' + (d.getMonth() + 1),
        year = d.getFullYear()

    if (day.length < 2) day = '0' + day
    if (month.length < 2) month = '0' + month

    return [day, month, year].join('.')
}

const filteredClimbingRoutes = computed(() => {
    let filteredRoutes = climbingRoutes.value.filter((route) => !route.archived)

    if (selectedDifficulty.value) {
        const selectedDifficultyInt = parseInt(selectedDifficulty.value)
        filteredRoutes = filteredRoutes.filter(
            (route) => parseInt(route.difficulty) === selectedDifficultyInt,
        )
    }
    if (selectedLocation.value) {
        filteredRoutes = filteredRoutes.filter(
            (route) => route.location === selectedLocation.value,
        )
    }
    if (selectedType.value) {
        filteredRoutes = filteredRoutes.filter(
            (route) => route.type === selectedType.value,
        )
    }
    if (searchRouteName.value) {
        filteredRoutes = filteredRoutes.filter((route) =>
            route.name
                .toLowerCase()
                .includes(searchRouteName.value.toLowerCase()),
        )
    }

    return filteredRoutes
})
</script>
