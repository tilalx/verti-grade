<template>
    <v-container class="dashboard">
        <newVersionAvailable></newVersionAvailable>
        <v-row>
            <v-col>
                <h1>{{ $t('dashboard.welcome') }}</h1>
            </v-col>
        </v-row>

        <v-row>
            <v-col cols="12" sm="6" class="d-flex align-center">
                <CreateRoute @closed="reloadRoutes"></CreateRoute>
                <ImportRoute @closed="reloadRoutes"></ImportRoute>
            </v-col>
        </v-row>

        <v-row>
            <v-col>
                <v-row>
                    <!-- Column for the Route Name search -->
                    <v-col cols="12" sm="3">
                        <v-text-field
                            :label="$t('climbing.searchRouteName')"
                            v-model="searchRouteName"
                            class="mt-2"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-select
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
                            :label="$t('climbing.location')"
                            :items="locations"
                            v-model="selectedLocation"
                            item-title="text"
                            item-value="value"
                            class="mt-2"
                        ></v-select>
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-checkbox
                            :label="$t('filter.archived')"
                            v-model="displayArchived"
                            class="mt-2"
                        ></v-checkbox>
                    </v-col>
                </v-row>
                <v-row>
                <v-col cols="12" class="d-flex flex-wrap align-center">
                    <!-- Select All Button -->
                    <v-btn @click="selectAll" color="primary" class="mb-2 mx-1">
                        <v-icon>{{
                            areAllSelected()
                                ? 'mdi-checkbox-marked-outline'
                                : 'mdi-checkbox-blank-outline'
                        }}</v-icon>
                        {{
                            areAllSelected()
                                ? $t('actions.deselect_all')
                                : $t('actions.select_all')
                        }}
                    </v-btn>
                    <v-btn
                        v-if="hasSelection"
                        @click="printSelected"
                        color="success"
                        class="mb-2 mx-1"
                    >
                        <v-icon>mdi-printer</v-icon>
                    </v-btn>
                    <v-btn
                        v-if="hasSelection"
                        @click="exportSelectedExcel"
                        color="success"
                        class="mb-2 mx-1"
                    >
                        <v-icon>mdi-file-excel</v-icon>
                    </v-btn>
                    <v-btn
                        v-if="hasSelection"
                        @click="exportSelectedJson"
                        color="success"
                        class="mb-2 mx-1"
                    >
                        <v-icon>mdi-code-json</v-icon>
                    </v-btn>
                    <v-btn
                        v-if="hasSelection"
                        @click="archiveSelected"
                        color="warning"
                        class="mb-2 mx-1"
                    >
                        <v-icon>mdi-archive</v-icon>
                    </v-btn>
                    <v-btn
                        v-if="hasSelection"
                        @click="showDeleteConfirmation = true"
                        color="error"
                        class="mb-2 mx-1"
                    >
                        <v-icon>mdi-delete</v-icon>
                    </v-btn>
                    <v-dialog
                        v-model="showDeleteConfirmation"
                        max-width="500px"
                    >
                        <v-card>
                            <v-card-text>{{
                                $t('notifications.deleteMoreItems')
                            }}</v-card-text>
                            <v-card-actions>
                                <v-btn color="error" @click="deleteSelected">{{
                                    $t('actions.delete')
                                }}</v-btn>
                                <v-btn
                                    color="primary"
                                    @click="showDeleteConfirmation = false"
                                    >{{ $t('actions.cancel') }}</v-btn
                                >
                            </v-card-actions>
                        </v-card>
                    </v-dialog>
                </v-col>
            </v-row>

                <v-data-table
                    :headers="headers"
                    :items="filteredClimbingRoutes"
                    :items-per-page="50"
                >
                    <template v-slot:[`item`]="{ item: climbingRoute }">
                        <tr>
                            <td>
                                <v-checkbox
                                    v-model="climbingRoute.selected"
                                    color="primary"
                                    hide-details
                                ></v-checkbox>
                            </td>
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
                            <td>{{ climbingRoute.location }}</td>
                            <td>{{ climbingRoute.type }}</td>
                            <td>
                                {{
                                    climbingRoute.score !== null
                                        ? climbingRoute.score.toFixed(2) + '/5'
                                        : climbingRoute.score
                                }}
                            </td>
                            <td>
                                {{
                                    climbingRoute.archived
                                        ? '&#9989;'
                                        : '&#10060;'
                                }}
                            </td>
                            <td>
                                {{
                                    new Date(
                                        climbingRoute.screw_date,
                                    ).toLocaleDateString('de-DE')
                                }}
                            </td>
                            <td>
                                <EditRoute
                                    @closed="reloadRoutes"
                                    :route_id="climbingRoute.id"
                                ></EditRoute>
                            </td>
                        </tr>
                    </template>
                </v-data-table>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import CreateRoute from '@/components/CreateRoute.vue'
import EditRoute from '@/components/EditRoute.vue'
import ImportRoute from '@/components/ImportRoute.vue'
import newVersionAvailable from '@/components/notifications/newVersionAvailable.vue'

const { t } = useI18n()

useHead({
    title: t('page.title.dashboard'),
    meta: [
        {
            name: 'description',
            content: t('page.content.dashboard'),
        },
    ],
})

definePageMeta({
    authRequired: true,
    middleware: ['auth'],
})

const routes = ref([])
const climbingRoutes = ref([])
const selectedDifficulty = ref('')
const selectedLocation = ref('')
const searchRouteName = ref('')
const selectedType = ref('')
const selected = ref([])
const displayArchived = ref(false)
const pb = usePocketbase()
const showDeleteConfirmation = ref(false)

const headers = reactive([
    { title: t('table.select'), value: 'selected' },
    { title: t('climbing.color'), value: 'color' },
    { title: t('climbing.routename'), value: 'name' },
    { title: t('climbing.difficulty'), value: 'difficulty' },
    { title: t('climbing.comment'), value: 'comment' },
    { title: t('climbing.creators'), value: 'creator' },
    { title: t('climbing.location'), value: 'location' },
    { title: t('climbing.type'), value: 'type' },
    { title: t('ratings.score'), value: 'rating' },
    { title: t('climbing.archived'), value: 'archived' },
    { title: t('table.created_at'), value: 'screw_date' },
    { title: t('table.actions'), value: 'actions' },
])

const difficulties = reactive([
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

const locations = reactive([
    { text: t('filter.all'), value: '' },
    { text: 'Hanau', value: 'Hanau' },
    { text: 'Gelnhausen', value: 'Gelnhausen' },
])

const types = reactive([
    { text: t('filter.all'), value: '' },
    { text: t('routes.types.boulder'), value: 'Boulder' },
    { text: t('routes.types.route'), value: 'Route' },
])

const getClimbingRoutes = async () => {
    try {
        const climbingRoutesData = await pb.collection('routes').getFullList({
            sort: '-screw_date',
        })

        const averageRating = await pb
            .collection('averageRating')
            .getFullList({})

        if (!climbingRoutesData || !averageRating) {
            console.error('Error fetching climbing routes')
            return
        }

        for (const route of climbingRoutesData) {
            const rating = averageRating.find((rate) => rate.id === route.id)
            if (rating) {
                route.score = rating.average_rating
            }
        }

        climbingRoutes.value = climbingRoutesData
    } catch (error) {
        console.error('Error in getClimbingRoutes:', error)
    }
}

pb.collection('routes').subscribe('*', () => {
    getClimbingRoutes()
})

const filteredClimbingRoutes = computed(() => {
    let filteredRoutes = climbingRoutes.value
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
    if (!displayArchived.value) {
        filteredRoutes = filteredRoutes.filter((route) => !route.archived)
    }
    return filteredRoutes
})

const hasSelection = computed(() => {
    return selectedCount.value > 0
})

const selectedCount = computed(() => {
    return filteredClimbingRoutes.value.filter((route) => route.selected).length
})

const selectedDifficultyValue = computed(() => {
    return selectedDifficulty.value
})

const selectedLocationValue = computed(() => {
    return selectedLocation.value
})

const reloadRoutes = async () => {
    await getClimbingRoutes()
}

const selectAll = () => {
    if (areAllSelected()) {
        deselectAll()
    } else {
        selectAllRoutes()
    }
}

const areAllSelected = () => {
    return filteredClimbingRoutes.value.every((route) => route.selected)
}

const deselectAll = () => {
    filteredClimbingRoutes.value.forEach((route) => {
        route.selected = false
    })
}

const selectAllRoutes = () => {
    filteredClimbingRoutes.value.forEach((route) => {
        route.selected = true
    })
}

const printSelected = async () => {
    const selectedRoutes = filteredClimbingRoutes.value.filter(
        (route) => route.selected,
    )
    const selectedRouteIds = selectedRoutes.map((route) => route.id).join(',')

    try {
        const response = await fetch('/api/ui/pdf?id=' + selectedRouteIds, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        const pdfBlob = await response.blob()
        const blob = new Blob([pdfBlob], { type: 'application/pdf' })
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        const currentDate = Math.floor(Date.now() / 1000)
        link.download = `climbing-routes-${currentDate}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    } catch (error) {
        console.error('Error downloading PDF:', error)
    }
}

const exportSelectedExcel = async () => {
    const selectedRoutes = filteredClimbingRoutes.value.filter(
        (route) => route.selected,
    )
    const selectedRouteIds = selectedRoutes.map((route) => route.id).join(',')

    try {
        const response = await fetch('/api/ui/xlsx?id=' + selectedRouteIds, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        const excelBlob = await response.blob()
        const blob = new Blob([excelBlob], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        const currentDate = Math.floor(Date.now() / 1000)
        link.download = `climbing-routes-${currentDate}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    } catch (error) {
        console.error('Error in exportSelectedAsExcel:', error)
    }
}

const exportSelectedJson = async () => {
    const selectedRoutes = filteredClimbingRoutes.value.filter(
        (route) => route.selected,
    )
    const selectedRouteIds = selectedRoutes.map((route) => route.id)
    if (selectedRouteIds.length === 0) {
        console.log('No routes selected for deletion.')
        return
    }

    try {
        const routeArray = []
        for (const routeId of selectedRouteIds) {
            const route = climbingRoutes.value.find(
                (route) => route.id === routeId,
            )
            if (!route) {
                console.error('Route not found:', routeId)
                continue
            }

            const responseRating = await pb.collection('ratings').getFullList({
                filter: `route_id = "${routeId}"`,
            })

            const ratings = []

            for (const rating of responseRating) {
                const rate = {
                    rating: rating.rating,
                    difficulty: rating.difficulty,
                    difficulty_sign: rating.difficulty_sign,
                    comment: rating.comment,
                    created: rating.created,
                    updated: rating.updated,
                }
                ratings.push(rate)
            }

            const data = {
                name: route.name,
                color: route.color,
                difficulty: route.difficulty,
                difficulty_sign: route.difficulty_sign,
                location: route.location,
                type: route.type,
                comment: route.comment,
                creator: route.creator,
                screw_date: route.screw_date,
                score: route.score,
                archived: route.archived,
                screw_date: route.screw_date,
                created: route.created,
                updated: route.updated,
                ratings: ratings,
            }
            routeArray.push(data)
        }

        const json = JSON.stringify(routeArray, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        const currentDate = Math.floor(Date.now() / 1000)
        link.download = `climbing-routes-${currentDate}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    } catch (error) {
        console.error('Error in exportSelectedAsJson:', error)
    }
}

const deleteSelected = async () => {
    const selectedRoutes = filteredClimbingRoutes.value.filter(
        (route) => route.selected,
    )
    const selectedRouteIds = selectedRoutes.map((route) => route.id)
    if (selectedRouteIds.length === 0) {
        console.log('No routes selected for deletion.')
        return
    }

    try {
        for (const routeId of selectedRouteIds) {
            const response = await pb.collection('routes').delete(routeId)
            if (!response) {
                console.error('Error deleting route:', routeId)
            }
        }
    } catch (error) {
        console.error('Exception in deleteSelected:', error)
    }
    showDeleteConfirmation.value = false
}

const archiveSelected = async () => {
    const selectedRoutes = filteredClimbingRoutes.value.filter(
        (route) => route.selected,
    )
    const selectedRouteIds = selectedRoutes.map((route) => route.id)
    if (selectedRouteIds.length === 0) {
        console.log('No routes selected for deletion.')
        return
    }

    try {
        for (const routeId of selectedRouteIds) {
            const response = await pb.collection('routes').update(routeId, {
                archived: true,
            })
            if (!response) {
                console.error('Error deleting route:', routeId)
            }
        }
    } catch (error) {
        console.error('Exception in deleteSelected:', error)
    }
}

onMounted(async () => {
    await getClimbingRoutes()
})
</script>
