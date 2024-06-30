@ -1,549 +1,556 @@
<template>
  <v-container class="dashboard">
    <v-row>
      <v-col>
        <h1>Welcome to the Dashboard!</h1>
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
        <h2>All Climbing Routes:</h2>
        <v-row>
          <!-- Column for the Route Name search -->
          <v-col cols="6" sm="3">
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

          <!-- Column for the Location select -->
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
              label="Display Archived"
              v-model="displayArchived"
              class="mt-2"
            ></v-checkbox>
          </v-col>
        </v-row>
        <v-col cols="12" sm="6" class="d-flex align-center">
          <!-- Select All Button -->
          <v-btn @click="selectAll" color="primary">
            <v-icon>{{
              areAllSelected()
                ? "mdi-checkbox-marked-outline"
                : "mdi-checkbox-blank-outline"
            }}</v-icon>
            {{ areAllSelected() ? "Deselect All" : "Select All" }}
          </v-btn>
          <div class="mx-2"></div>
          <v-btn v-if="hasSelection" @click="printSelected" color="success">
            <v-icon>mdi-printer</v-icon>
          </v-btn>
          <div class="mx-2"></div>
          <v-btn
            v-if="hasSelection"
            @click="exportSelectedExcel"
            color="success"
          >
            <v-icon>mdi-file-excel</v-icon>
          </v-btn>
          <div class="mx-2"></div>
          <v-btn
            v-if="hasSelection"
            @click="exportSelectedJson"
            color="success"
          >
            <v-icon>mdi-code-json</v-icon>
          </v-btn>
          <div class="mx-2"></div>
          <v-btn v-if="hasSelection" @click="archiveSelected" color="warning">
            <v-icon>mdi-archive</v-icon>
          </v-btn>
          <div class="mx-2"></div>
          <v-dialog
            v-model="showDeleteConfirmation"
            max-width="500px"
            class="ml-auto"
          >
            <v-card>
              <v-card-title>Delete Confirmation</v-card-title>
              <v-card-text>
                Are you sure you want to delete the selected items?
              </v-card-text>
              <v-card-actions>
                <v-btn color="primary" @click="deleteSelected">Yes</v-btn>
                <v-btn color="error" @click="showDeleteConfirmation = false"
                  >No</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-btn
            v-if="hasSelection"
            @click="showDeleteConfirmation = true"
            color="error"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </v-col>

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
                <v-avatar :color="climbingRoute.color" size="30"></v-avatar>
              </td>
              <td>{{ climbingRoute.name }}</td>
              <td>
                {{ climbingRoute.difficulty }}
                {{
                  climbingRoute.difficultySign
                    ? "+"
                    : climbingRoute.difficultySign === false
                    ? "-"
                    : null
                }}
              </td>
              <td>{{ climbingRoute.location }}</td>
              <td>{{ climbingRoute.type }}</td>
              <td>{{ climbingRoute.comment }}</td>
              <td>{{ climbingRoute.creator.join(",") }}</td>
              <td>
                {{
                  new Date(climbingRoute.screw_date).toLocaleDateString("de-DE")
                }}
              </td>
              <td>{{ climbingRoute.score !== null ? climbingRoute.score + '/10' : climbingRoute.score }}</td>
              <td>{{ climbingRoute.archived }}</td>
              <td>
                <EditRoute
                  @closed="reloadRoutes"
                  :route_id="climbingRoute.id"
                ></EditRoute>
              </td>
            </tr>
          </template>
        </v-data-table>

        <div v-if="hasSelection" class="selection-info">
          Selection: {{ selectedCount }} routes selected.
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, reactive, onMounted } from "vue";
import CreateRoute from "@/components/CreateRoute.vue";
import EditRoute from "@/components/EditRoute.vue";
import ImportRoute from "@/components/ImportRoute.vue";
import { useI18n } from "vue-i18n";

export default {
  name: "DashBoard",
  components: { CreateRoute, EditRoute, ImportRoute },
  setup() {
    useHead({
      title: "Dashboard - Verti-Grade",
      meta: [
        {
          name: "description",
          content: "Dashboard for Verti-Grade",
        },
      ],
    });
    definePageMeta({
      authRequired: true,
      middleware: ["auth"],
    });

    const { t } = useI18n();
    const routes = ref([]);
    const climbingRoutes = ref([]);
    const selectedDifficulty = ref("");
    const selectedLocation = ref("");
    const searchRouteName = ref("");
    const selected = ref([]);
    const displayArchived = ref(false);
    const supabase = useSupabaseClient();
    const showDeleteConfirmation = ref(false);

    const headers = reactive([
      { title: t("table.select"), value: "selected" },
      { title: t("climbing.color"), value: "color" },
      { title: t("climbing.routename"), value: "name" },
      { title: t("climbing.difficulty"), value: "difficulty" },
      { title: t("climbing.location"), value: "location" },
      { title: t("climbing.type"), value: "type" },
      { title: t("climbing.comment"), value: "comment" },
      { title: t("climbing.creators"), value: "creator" },
      { title: t("table.created_at"), value: "screw_date" },
      { title: t("rating.score"), value: "rating"},
      { title: t("climbing.archived"), value: "archived" },
      { title: t("table.actions"), value: "actions" },
    ]);

    const difficulties = reactive([
      { text: t("filter.all"), value: "" },
      { text: "1", value: "1" },
      { text: "2", value: "2" },
      { text: "3", value: "3" },
      { text: "4", value: "4" },
      { text: "5", value: "5" },
      { text: "6", value: "6" },
      { text: "7", value: "7" },
      { text: "8", value: "8" },
      { text: "9", value: "9" },
      { text: "10", value: "10" },
    ]);

    const locations = reactive([
      { text: t("filter.all"), value: "" },
      { text: "Hanau", value: "Hanau" },
      { text: "Gelnhausen", value: "Gelnhausen" },
    ]);

    const getClimbingRoutes = async () => {
      const { data, error } = await supabase
        .from("climbingroutes")
        .select(`
          *,
          ratings(rating)
        `)
        .order("screw_date", { ascending: false })

      if (error) {
        console.error(error);
        return;
      }

      climbingRoutes.value = data;
      climbingRoutes.value.forEach((route) => {
        route.selected = false;
      });
      climbingRoutes.value = data.map(route => ({
        ...route,
        score: route.ratings && route.ratings.length > 0
      ? route.ratings.map(r => r.rating).reduce((a, b) => a + b, 0) / route.ratings.length: null
      }));
    };


    const channel = supabase
      .channel("db-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for all events: INSERT, UPDATE, DELETE
          schema: "public",
          table: "climbingroutes",
        },
        async (payload) => {
          await getClimbingRoutes();
        }
      )
      .subscribe();

    const filteredClimbingRoutes = computed(() => {
      let filteredRoutes = climbingRoutes.value;
      if (selectedDifficulty.value) {
        const selectedDifficultyInt = parseInt(selectedDifficulty.value);
        filteredRoutes = filteredRoutes.filter(
          (route) => parseInt(route.difficulty) === selectedDifficultyInt
        );
      }
      if (selectedLocation.value) {
        filteredRoutes = filteredRoutes.filter(
          (route) => route.location === selectedLocation.value
        );
      }
      if (searchRouteName.value) {
        filteredRoutes = filteredRoutes.filter((route) =>
          route.name.toLowerCase().includes(searchRouteName.value.toLowerCase())
        );
      }
      if (!displayArchived.value) {
        filteredRoutes = filteredRoutes.filter((route) => !route.archived);
      }
      return filteredRoutes;
    });

    const hasSelection = computed(() => {
      return selectedCount.value > 0;
    });

    const selectedCount = computed(() => {
      return filteredClimbingRoutes.value.filter((route) => route.selected)
        .length;
    });

    const selectedDifficultyValue = computed(() => {
      return selectedDifficulty.value;
    });

    const selectedLocationValue = computed(() => {
      return selectedLocation.value;
    });

    const reloadRoutes = async () => {
      await getClimbingRoutes();
    };

    const selectAll = () => {
      if (areAllSelected()) {
        deselectAll();
      } else {
        selectAllRoutes();
      }
    };

    const areAllSelected = () => {
      return filteredClimbingRoutes.value.every((route) => route.selected);
    };

    const deselectAll = () => {
      filteredClimbingRoutes.value.forEach((route) => {
        route.selected = false;
      });
    };

    const selectAllRoutes = () => {
      filteredClimbingRoutes.value.forEach((route) => {
        route.selected = true;
      });
    };

    const printSelected = async () => {
      const selectedRoutes = filteredClimbingRoutes.value.filter(
        (route) => route.selected
      );
      const selectedRouteIds = selectedRoutes
        .map((route) => route.id)
        .join(",");

      try {
        const response = await fetch("/api/pdf?id=" + selectedRouteIds, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Check if the response is ok (status 200-299)
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const pdfBlob = await response.blob();
        const blob = new Blob([pdfBlob], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        const currentDate = Math.floor(Date.now() / 1000);
        link.download = `climbing-routes-${currentDate}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Error downloading PDF:", error);
      }
    };

    const exportSelectedExcel = async () => {
      const selectedRoutes = filteredClimbingRoutes.value.filter(
        (route) => route.selected
      );
      const selectedRouteIds = selectedRoutes
        .map((route) => route.id)
        .join(",");

      try {
        const response = await fetch("/api/xlsx?id=" + selectedRouteIds, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const excelBlob = await response.blob();
        const blob = new Blob([excelBlob], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        const currentDate = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
        link.download = `climbing-routes-${currentDate}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Error in exportSelectedAsExcel:", error);
      }
    };

    const exportSelectedJson = async () => {
      const selectedRoutes = filteredClimbingRoutes.value.filter(
        (route) => route.selected
      );
      const selectedRouteIds = selectedRoutes.map((route) => route.id);
      if (selectedRouteIds.length === 0) {
        console.log("No routes selected for deletion.");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("climbingroutes")
          .select(
            `
            name,
            difficulty,
            difficultySign,
            location,
            creator,
            screw_date,
            comment,
            color,
            type,
            archived,
            created_at,
            ratings (
              rating,
              difficulty,
              difficultySign,
              comment,
              created_at
            )
          `
          )
          .in("id", selectedRouteIds);

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        const currentDate = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
        link.download = `climbing-routes-${currentDate}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Error in exportSelectedAsJson:", error);
      }
    };

    const deleteSelected = async () => {
      const selectedRoutes = filteredClimbingRoutes.value.filter(
        (route) => route.selected
      );
      const selectedRouteIds = selectedRoutes.map((route) => route.id);
      if (selectedRouteIds.length === 0) {
        console.log("No routes selected for deletion.");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("climbingroutes")
          .delete()
          .in("id", selectedRouteIds);

        if (error) {
          console.error("Error in deleteSelected:", error);
        }
      } catch (error) {
        console.error("Exception in deleteSelected:", error);
      }
      showDeleteConfirmation.value = false;
    };

    const archiveSelected = async () => {
      const selectedRoutes = filteredClimbingRoutes.value.filter(
        (route) => route.selected
      );
      const selectedRouteIds = selectedRoutes.map((route) => route.id);
      if (selectedRouteIds.length === 0) {
        console.log("No routes selected for deletion.");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("climbingroutes")
          .update({ archived: true })
          .in("id", selectedRouteIds);

        if (error) {
          console.error("Error in deleteSelected:", error);
        }
      } catch (error) {
        console.error("Exception in deleteSelected:", error);
      }
    };

    onMounted(async () => {
      await getClimbingRoutes();
    });

    return {
      routes,
      climbingRoutes,
      selectedDifficulty,
      selectedLocation,
      searchRouteName,
      selected,
      displayArchived,
      headers,
      difficulties,
      locations,
      filteredClimbingRoutes,
      hasSelection,
      selectedCount,
      selectedDifficultyValue,
      selectedLocationValue,
      reloadRoutes,
      selectAll,
      areAllSelected,
      deselectAll,
      selectAllRoutes,
      printSelected,
      exportSelectedExcel,
      exportSelectedJson,
      deleteSelected,
      archiveSelected,
      showDeleteConfirmation,
    };
  },
};
</script>

<style scoped></style>
