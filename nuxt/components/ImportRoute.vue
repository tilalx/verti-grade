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
import { ref } from "vue";

export default {
  setup() {
    const fileInput = ref(null);

    const supabase = useSupabaseClient();

    const openFilePicker = () => {
      //open file explorer
      fileInput.value.click();
    };

    const handleFileChange = async (event) => {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = async () => {
        const importedRoutes = JSON.parse(reader.result);
        await importJsonToClimbingRoutes(importedRoutes);
      };

      reader.readAsText(file);
    };

    async function importJsonToClimbingRoutes(jsonData) {
      // Extract climbing routes and ratings from jsonData
      const climbingRoutes = jsonData.map((route) => {
        const { ratings, ...routeData } = route;
        return routeData;
      });

      // Insert climbing routes
      const { data: routeData, error: routeError } = await supabase
        .from("climbingroutes")
        .insert(climbingRoutes)
        .select(); // Ensure we get the inserted data back

      if (routeError) {
        console.error("Error inserting climbing routes:", routeError);
        return;
      }

      // Prepare ratings with the correct routeId
      const ratings = [];
      routeData.forEach((route, index) => {
        const routeRatings = jsonData[index].ratings.map((rating) => ({
          ...rating,
          routeId: route.id,
        }));
        ratings.push(...routeRatings);
      });

      // Insert ratings
      const { data: ratingData, error: ratingError } = await supabase
        .from("ratings")
        .insert(ratings);

      if (ratingError) {
        console.error("Error inserting ratings:", ratingError);
        return;
      }

      console.log(
        "Successfully imported climbing routes and ratings:",
        routeData,
        ratingData
      );
    }

    return {
      fileInput,
      openFilePicker,
      handleFileChange,
    };
  },
};
</script>
