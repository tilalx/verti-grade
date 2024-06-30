<template>
  <v-container>
    <v-btn color="primary" @click="openDialog">Ratiings</v-btn>
    <v-dialog v-model="dialog" persistent max-width="800px">
      <v-card>
        <v-card-title>
          Route Details
          <v-spacer></v-spacer>
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
                <td>{{ item.difficulty }}</td>
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
import { ref } from "vue";

const props = defineProps({
  route_id: {
    type: String,
    required: true,
  },
});

const supabase = useSupabaseClient();
const dialog = ref(false);
const routeDetails = ref([]);
const headers = [
  { title: "Rating", value: "rating" },
  { title: "Difficulty", value: "difficulty" },
  { title: "Comment", value: "comment" },
];

const channel = supabase
  .channel("db-changes")
  .on(
    "postgres_changes",
    {
      event: "*", // Listen for all events: INSERT, UPDATE, DELETE
      schema: "public",
      table: "ratings",
    },
    async (payload) => {
      await getClimbingRatings();
    }
  )
  .subscribe();

function openDialog() {
  dialog.value = true;
  getClimbingRatings();
}

async function getClimbingRatings() {
  const { data: ratings } = await supabase
    .from("ratings")
    .select()
    .eq("route_id", props.route_id)
    .order("created_at", { ascending: false });

  routeDetails.value = ratings;
}
</script>
