<template>
    <div>
        <input
            type="file"
            ref="fileInput"
            style="display: none"
            @change="handleFileChange"
            accept="application/json"
        />
        <v-btn @click="openFilePicker" color="primary">{{
            $t('actions.import')
        }}</v-btn>
    </div>
</template>

<script>
import { ref } from 'vue'

export default {
    setup() {
        const fileInput = ref(null)
        const pb = usePocketbase()

        const openFilePicker = () => {
            fileInput.value.click()
        }

        const handleFileChange = async (event) => {
            const file = event.target.files[0]
            const reader = new FileReader()

            reader.onload = async () => {
                const importedRoutes = JSON.parse(reader.result)
                await importJsonToClimbingRoutes(importedRoutes)
            }

            reader.readAsText(file)
        }

        const importJsonToClimbingRoutes = async (jsonData) => {
            try {
                // Step 1: Prepare the data
                const routesData = jsonData.map((route) => {
                    const { ratings, ...routeData } = route
                    return routeData
                })

                // Step 2: Batch insert routes
                const routeBatch = pb.createBatch()
                routesData.forEach((route) => {
                    routeBatch.collection('routes').create(route)
                })
                const routeResults = await routeBatch.send()

                // Step 3: Retrieve inserted route IDs
                const routeIdMap = {}
                routeResults.forEach((result, index) => {
                    if (
                        result.status === 200 &&
                        result.body &&
                        result.body.id
                    ) {
                        const originalRoute = jsonData[index]
                        routeIdMap[originalRoute.name] = result.body.id
                    } else {
                        console.error(
                            `Failed to insert route at index ${index}:`,
                            result,
                        )
                    }
                })

                // Step 4: Associate ratings with route IDs
                const ratingsData = jsonData.flatMap((route) => {
                    const routeId = routeIdMap[route.name]
                    if (!routeId) {
                        console.error(
                            `No route ID found for route: ${route.name}`,
                        )
                        return []
                    }
                    return route.ratings.map((rating) => ({
                        ...rating,
                        route_id: routeId,
                    }))
                })

                // Step 5: Batch insert ratings
                const ratingBatch = pb.createBatch()
                ratingsData.forEach((rating) => {
                    ratingBatch.collection('ratings').create(rating)
                })
                const ratingResults = await ratingBatch.send()

                // Handle any errors
                const failedRatings = ratingResults.filter(
                    (result) => result.status !== 200,
                )
                if (failedRatings.length > 0) {
                    console.error(
                        'Errors occurred while inserting ratings:',
                        failedRatings,
                    )
                } else {
                    console.log('Import completed successfully.')
                }
            } catch (error) {
                console.error('Error during import:', error)
            }
        }

        return {
            fileInput,
            openFilePicker,
            handleFileChange,
        }
    },
}
</script>
