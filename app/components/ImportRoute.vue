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
        // Step 1: Prepare the route data, stripping any existing ID
        const routesData = jsonData.map((route) => {
            const { id, ratings, ...routeData } = route
            return routeData
        })

        // Step 2: Batch insert routes
        const routeBatch = pb.createBatch()
        routesData.forEach((route) => {
            routeBatch.collection('routes').create(route)
        })
        const routeResults = await routeBatch.send()

        // Step 3 & 4: Prepare ratings by linking them to the newly created route IDs
        const ratingsData = [];
        routeResults.forEach((result, index) => {
            if (result.statusCode === 200 && result.data?.id) {
                const newRouteId = result.data.id;
                const originalRoute = jsonData[index];

                if (originalRoute.ratings && originalRoute.ratings.length > 0) {
                    originalRoute.ratings.forEach(rating => {
                        const { id, ...ratingData } = rating; // IMPORTANT: Strip old rating ID
                        ratingsData.push({
                            ...ratingData,
                            route_id: newRouteId, // Use the newly created route ID
                            user: rating.user || currentUser.id, // Assign current user if not present in data
                        });
                    });
                }
            } else {
                const originalRouteName = jsonData[index]?.name || `at index ${index}`;
                console.error(`Failed to insert route: ${originalRouteName}`, result);
            }
        });

        // Step 5: Batch insert ratings if there are any
        if (ratingsData.length > 0) {
            const ratingBatch = pb.createBatch()
            ratingsData.forEach((rating) => {
                ratingBatch.collection('ratings').create(rating)
            })
            await ratingBatch.send()
        }

        showSnackbar('Import completed successfully!', 'success')
        emit('closed') // Notify parent to reload data
    } catch (error) {
        console.error('Error during import:', error)
        showSnackbar(error.message || 'An unexpected error occurred during import.', 'error')
    } finally {
        loading.value = false
        cancelImport()
    }
}
</script>