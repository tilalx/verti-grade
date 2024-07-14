<template>
    <div>
        <input
            type="file"
            ref="fileInput"
            style="display: none"
            @change="handleFileChange"
            accept="application/json"
        />
        <v-btn @click="openFilePicker" color="primary">Import Routes</v-btn>
    </div>
</template>

<script>
import { ref } from 'vue'

export default {
    setup() {
        const fileInput = ref(null)

        const pb = usePocketbase()

        const openFilePicker = () => {
            //open file explorer
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

        async function importJsonToClimbingRoutes(jsonData) {
            // Extract climbing routes and ratings from jsonData
            const climbingRoutes = jsonData.map((route) => {
                const { ratings, ...routeData } = route
                return routeData
            })

            // Insert climbing routes one at a time
            for (const route of climbingRoutes) {
                const result = await pb.collection('routes').create(route)

                if (result.error) {
                    console.error(
                        'Error inserting climbing route:',
                        result.error,
                    )
                    continue
                }

                // Prepare ratings with the correct route_id
                const routeId = result.id
                const routeRatings = jsonData
                    .find((r) => r.name === route.name)
                    .ratings.map((rating) => ({
                        ...rating,
                        route_id: routeId,
                    }))

                // Insert ratings one at a time
                for (const rating of routeRatings) {
                    const ratingResult = await pb
                        .collection('ratings')
                        .create(rating)

                    if (ratingResult.error) {
                        console.error(
                            'Error inserting rating:',
                            ratingResult.error,
                        )
                        continue
                    }
                }
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
