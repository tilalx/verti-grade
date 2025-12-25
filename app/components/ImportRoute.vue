<template>
    <div>
        <!-- Hidden file input -->
        <input
            type="file"
            ref="fileInput"
            style="display: none"
            @change="handleFileChange"
            accept="application/json"
        />
        
        <!-- Import Button -->
        <v-btn @click="openFilePicker" color="primary">{{ $t('actions.import') }}</v-btn>

        <!-- Import Preview Dialog -->
        <v-dialog v-model="showPreviewDialog" persistent max-width="900px">
            <v-card>
                <v-card-title>
                    <span class="text-h5">Confirm Import</span>
                </v-card-title>
                <v-card-text>
                    <p class="mb-4">The following routes and ratings will be imported. Please review the data before confirming.</p>
                    
                    <v-data-table
                        :headers="previewHeaders"
                        :items="routesToImport"
                        item-value="name"
                        v-model:expanded="expanded"
                        show-expand
                        class="elevation-1"
                    >
                        <template v-slot:item.color="{ item }">
                            <v-avatar :color="item.color" size="24" />
                        </template>

                        <template v-slot:item.ratings="{ item }">
                            {{ item.ratings?.length || 0 }}
                        </template>

                        <template v-slot:expanded-row="{ columns, item }">
                            <tr>
                                <td :colspan="columns.length">
                                    <v-card v-if="item.ratings?.length" class="my-4" elevation="2">
                                        <v-card-title class="text-subtitle-1">Ratings for {{ item.name }}</v-card-title>
                                        <v-list density="compact">
                                            <v-list-item v-for="(rating, i) in item.ratings" :key="i">
                                                <v-list-item-title><strong>Rating:</strong> {{ rating.rating }}/5, <strong>Difficulty:</strong> {{ rating.difficulty }}</v-list-item-title>
                                                <v-list-item-subtitle>{{ rating.comment || 'No comment' }}</v-list-item-subtitle>
                                            </v-list-item>
                                        </v-list>
                                    </v-card>
                                    <p v-else class="text-center pa-4">No ratings to import for this route.</p>
                                </td>
                            </tr>
                        </template>
                    </v-data-table>

                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="cancelImport">Cancel</v-btn>
                    <v-btn color="primary" @click="confirmImport" :loading="loading">Confirm & Import</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Snackbar for feedback -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000" top>
            {{ snackbar.message }}
        </v-snackbar>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const pb = usePocketbase()
const emit = defineEmits(['closed'])
const currentUser = pb.authStore.model;

const fileInput = ref(null)
const showPreviewDialog = ref(false)
const loading = ref(false)
const routesToImport = ref([])
const expanded = ref([])

const snackbar = reactive({ show: false, message: '', color: 'success' })

const previewHeaders = [
    { title: 'Color', value: 'color', sortable: false },
    { title: 'Name', value: 'name' },
    { title: 'Difficulty', value: 'difficulty' },
    { title: 'Anchor Point', value: 'anchor_point' },
    { title: 'Location', value: 'location' },
    { title: 'Ratings', value: 'ratings' },
]

function showSnackbar(message, color = 'success') {
    snackbar.message = message
    snackbar.color = color
    snackbar.show = true
}

const openFilePicker = () => {
    fileInput.value.click()
}

const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
        try {
            const parsedData = JSON.parse(reader.result)
            if (!Array.isArray(parsedData)) {
                throw new Error("JSON file is not an array.")
            }
            routesToImport.value = parsedData.map(route => ({
                ...route,
                ratingsCount: route.ratings?.length || 0
            }));
            showPreviewDialog.value = true
        } catch (error) {
            console.error("Error parsing JSON file:", error)
            showSnackbar("Invalid JSON file. Please check the file format.", "error")
        }
    }
    reader.onerror = () => {
        showSnackbar("Failed to read the file.", "error")
    }
    reader.readAsText(file)

    // Reset file input to allow selecting the same file again
    event.target.value = ''
}

const cancelImport = () => {
    showPreviewDialog.value = false
    routesToImport.value = []
}

const confirmImport = async () => {
    loading.value = true
    const jsonData = routesToImport.value;

    try {
        const fallbackCreator = buildFallbackCreator(currentUser)
        const routeErrors = []
        const ratingErrors = []

        for (const route of jsonData) {
            try {
                const createdRoute = await pb.collection('routes').create(
                    sanitizeRoutePayload(route, fallbackCreator),
                )

                if (Array.isArray(route.ratings) && route.ratings.length > 0) {
                    for (const rating of route.ratings) {
                        try {
                            await pb.collection('ratings').create(
                                sanitizeRatingPayload(rating, {
                                    routeId: createdRoute.id,
                                    fallbackUserId: currentUser?.id,
                                }),
                            )
                        } catch (ratingError) {
                            console.error('Failed to insert rating', ratingError)
                            ratingErrors.push({
                                routeName: route.name,
                                message: ratingError?.message ?? 'Unknown rating error',
                            })
                        }
                    }
                }
            } catch (routeError) {
                console.error('Failed to insert route', routeError)
                routeErrors.push({
                    routeName: route?.name ?? 'Unnamed Route',
                    message: routeError?.message ?? 'Unknown route error',
                })
            }
        }

        if (routeErrors.length === 0 && ratingErrors.length === 0) {
            showSnackbar('Import completed successfully!', 'success')
        } else {
            const summaryParts = []
            if (routeErrors.length > 0) {
                summaryParts.push(`${routeErrors.length} route(s) failed`)
            }
            if (ratingErrors.length > 0) {
                summaryParts.push(`${ratingErrors.length} comment(s) failed`)
            }
            const details = summaryParts.join(', ')
            showSnackbar(`Import finished with issues: ${details}`, 'warning')
        }

        emit('closed')
    } catch (error) {
        console.error('Error during import:', error)
        showSnackbar(error.message || 'An unexpected error occurred during import.', 'error')
    } finally {
        loading.value = false
        cancelImport()
    }
}

function sanitizeRoutePayload(route, fallbackCreator) {
    const normalizeSign = (value) => {
        if (value === true || value === false || value === null) {
            return value
        }
        const sign = typeof value === 'string' ? value.trim() : ''
        return sign === '+' ? true : sign === '-' ? false : null
    }

    const numericDifficulty = Number(route.difficulty)
    const normalizedCreators = Array.isArray(route.creator)
        ? route.creator
              .map((value) => (typeof value === 'string' ? value.trim() : ''))
              .filter(Boolean)
        : typeof route.creator === 'string'
          ? route.creator
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean)
          : []

    return {
        name: typeof route.name === 'string' ? route.name : '',
        difficulty: Number.isFinite(numericDifficulty) ? numericDifficulty : 0,
        difficulty_sign: normalizeSign(route.difficulty_sign),
        anchor_point: Number.isFinite(Number(route.anchor_point))
            ? Number(route.anchor_point)
            : null,
        location: route.location || null,
        type: route.type || null,
        comment: typeof route.comment === 'string' ? route.comment : '',
        creator: normalizedCreators.length > 0
            ? normalizedCreators
            : fallbackCreator
                ? [fallbackCreator]
                : [],
        screw_date: route.screw_date || null,
        color: route.color || null,
        archived: Boolean(route.archived),
    }
}

function sanitizeRatingPayload(rating, meta) {
    const normalizeSign = (value) => {
        if (value === true || value === false || value === null) {
            return value
        }
        const sign = typeof value === 'string' ? value.trim() : ''
        return sign === '+' ? true : sign === '-' ? false : null
    }

    const payload = {
        route_id: meta.routeId,
        rating: Number.isFinite(Number(rating.rating)) ? Number(rating.rating) : null,
        difficulty: Number.isFinite(Number(rating.difficulty))
            ? Number(rating.difficulty)
            : 0,
        difficulty_sign: normalizeSign(rating.difficulty_sign),
        comment: typeof rating.comment === 'string' ? rating.comment : '',
    }

    const userId = rating.user || meta.fallbackUserId
    if (userId) {
        payload.user = userId
    }

    return payload
}

function buildFallbackCreator(user) {
    if (!user) {
        return 'Imported'
    }

    const candidates = [
        user.name,
        `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim(),
        user.username,
        user.email,
    ].filter((value) => typeof value === 'string' && value.trim())

    return candidates[0] || 'Imported'
}
</script>