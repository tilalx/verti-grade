<template>
  <v-app>
    <v-main>
      <v-container>

        <!-- DESKTOP Filters -->
        <v-row v-if="mdAndUp">
          <v-col cols="12" md="3">
            <v-text-field
              :id="routeNameId"
              :label="$t('climbing.searchRouteName')"
              v-model="searchRouteName"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              :id="difficultyId"
              :label="$t('climbing.difficulty')"
              :items="difficulties"
              v-model="selectedDifficulty"
              item-title="text"
              item-value="value"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              :id="typeId"
              :label="$t('climbing.type')"
              :items="types"
              v-model="selectedType"
              item-title="text"
              item-value="value"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              :id="locationId"
              :label="$t('climbing.location')"
              :items="locations"
              v-model="selectedLocation"
              item-title="text"
              item-value="value"
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>

        <!-- MOBILE Filters -->
        <v-row v-if="smAndDown" align="center" class="mb-2">
            <v-col>
                <v-text-field
                    :id="routeNameId"
                    :label="$t('climbing.searchRouteName')"
                    v-model="searchRouteName"
                    density="comfortable"
                    hide-details
                />
            </v-col>
            <v-col cols="auto">
                <v-btn @click="isFilterSheetOpen = true" icon>
                    <v-badge :content="activeFilterCount" color="primary" :model-value="activeFilterCount > 0">
                        <v-icon>mdi-filter-variant</v-icon>
                    </v-badge>
                </v-btn>
            </v-col>
        </v-row>

        <!-- Filter Bottom Sheet for Mobile -->
        <v-bottom-sheet v-model="isFilterSheetOpen" v-if="smAndDown">
            <v-card>
                <v-card-title class="text-h5 text-center">{{ $t('filter.title') }}</v-card-title>
                <v-card-text>
                    <v-select
                        :id="difficultyId"
                        :label="$t('climbing.difficulty')"
                        :items="difficulties"
                        v-model="selectedDifficulty"
                        item-title="text"
                        item-value="value"
                        density="comfortable"
                        hide-details
                        class="mb-4"
                    />
                    <v-select
                        :id="typeId"
                        :label="$t('climbing.type')"
                        :items="types"
                        v-model="selectedType"
                        item-title="text"
                        item-value="value"
                        density="comfortable"
                        hide-details
                        class="mb-4"
                    />
                    <v-select
                        :id="locationId"
                        :label="$t('climbing.location')"
                        :items="locations"
                        v-model="selectedLocation"
                        item-title="text"
                        item-value="value"
                        density="comfortable"
                        hide-details
                    />
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="clearFilters" variant="text">{{ $t('actions.clear') }}</v-btn>
                    <v-spacer/>
                    <v-btn color="primary" @click="isFilterSheetOpen = false" variant="flat">{{ $t('actions.search') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-bottom-sheet>

        <!-- DESKTOP VIEW: Data Table -->
        <v-data-table-server
          v-if="mdAndUp"
          class="mt-4"
          :headers="headersDesktop"
          :items="routes"
          :items-length="totalItems"
          :loading="loading"
          :page="tableOptions.page"
          :items-per-page="tableOptions.itemsPerPage"
          :sort-by="tableOptions.sortBy"
          item-value="id"
          density="comfortable"
          @update:options="loadRoutes"
        >
          <template #item.color="{ item }">
            <v-avatar :color="item.color" size="30" />
          </template>
          <template #item.name="{ item }">
            <div class="d-flex align-center">
              <span class="route-name">{{ item.name }}</span>
              <v-icon v-if="item.has_ratings" color="yellow-darken-2" size="small" class="ml-2">mdi-star-circle</v-icon>
            </div>
          </template>
          <template #item.difficulty="{ item }">
            <span>{{ formatDifficulty(item) }}</span>
          </template>
          <template #item.comment="{ item }">
            <div class="route-comment">{{ item.comment }}</div>
          </template>
          <template #item.creator="{ item }">
            <div class="creator-chips">
              <v-chip v-for="c in item.creator" :key="c" size="small">{{ c }}</v-chip>
            </div>
          </template>
          <template #item.screw_date="{ item }">
            {{ formatDate(item.screw_date) }}
          </template>
          <template #item.actions="{ item }">
            <RouteDetails :route_id="item.id" />
          </template>
        </v-data-table-server>

        <!-- MOBILE VIEW: Card List -->
        <div v-if="smAndDown">
          <v-row class="mt-2">
            <v-col v-for="route in routes" :key="route.id" cols="12">
              <v-card variant="outlined" class="mobile-route-card">
                 <div class="route-difficulty-display text-h5 font-weight-bold">
                    {{ formatDifficulty(route) }}
                </div>
                <v-list-item class="pt-3 pb-2 pr-12">
                  <template #prepend>
                    <v-avatar :color="route.color" size="32" class="mr-4" />
                  </template>
                  <v-list-item-title class="text-h6 font-weight-bold d-flex align-center">
                    {{ route.name }}
                    <v-icon v-if="route.has_ratings" color="yellow-darken-2" size="small" class="ml-2">mdi-star-circle</v-icon>
                  </v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list density="compact" class="py-1">
                  <v-list-item :subtitle="route.comment || '—'">
                    <template #prepend><v-icon size="small" class="mr-3">mdi-comment-text-outline</v-icon></template>
                  </v-list-item>
                  <v-list-item>
                    <template #prepend><v-icon size="small" class="mr-3">mdi-account-hard-hat</v-icon></template>
                    <div class="d-flex ga-1 flex-wrap mt-1">
                      <v-chip v-for="c in route.creator" :key="c" size="x-small">{{ c }}</v-chip>
                    </div>
                  </v-list-item>
                   <v-list-item :subtitle="formatDate(route.screw_date) || '—'">
                    <template #prepend><v-icon size="small" class="mr-3">mdi-calendar-month</v-icon></template>
                  </v-list-item>
                </v-list>
                <v-card-actions class="pa-2">
                  <v-spacer />
                  <RouteDetails :route_id="route.id" />
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
          
          <!-- "Load More" Button for Mobile -->
          <div v-if="routes.length < totalItems" class="text-center pa-4">
            <v-btn :loading="loading" @click="loadMore" variant="tonal" color="primary">
              {{ $t('actions.load_more') }}
            </v-btn>
          </div>
        </div>

        <!-- Empty State / Skeleton Loader on Mobile -->

        <div v-if="!loading && routes.length === 0 && smAndDown" class="text-center pa-8 mt-4">
          <v-icon size="x-large" class="mb-4">mdi-magnify-remove-outline</v-icon>
          <h3 class="text-h6">{{ $t('table.no_data') }}</h3>
        </div>

      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
const { t } = useI18n();
const pb = usePocketbase();
const { smAndDown, mdAndUp } = useDisplay();

useHead({
  title: t('page.title.index'),
  meta: [{ name: 'description', content: t('page.content.index'), authRequired: false }],
});

const routeNameId = useId(), difficultyId = useId(), typeId = useId(), locationId = useId();

// Filter State
const selectedDifficulty = ref(''), selectedLocation = ref(''), selectedType = ref(''), searchRouteName = ref('');
const isFilterSheetOpen = ref(false);

const activeFilterCount = computed(() => {
  return [selectedDifficulty.value, selectedLocation.value, selectedType.value].filter(Boolean).length;
});

function clearFilters() {
  selectedDifficulty.value = '';
  selectedLocation.value = '';
  selectedType.value = '';
  isFilterSheetOpen.value = false;
}

const tableOptions = reactive({
  page: 1,
  itemsPerPage: 20,
  sortBy: [{ key: 'screw_date', order: 'desc' }],
});

const loading = ref(true), routes = ref([]), totalItems = ref(0);

const headersDesktop = [
  { title: t('climbing.color'), key: 'color', sortable: false },
  { title: t('climbing.routename'), key: 'name' },
  { title: t('climbing.difficulty'), key: 'difficulty' },
  { title: t('climbing.comment'), key: 'comment' },
  { title: t('climbing.creators'), key: 'creator' },
  { title: t('table.created_at'), key: 'screw_date' },
  { title: t('table.actions'), key: 'actions', sortable: false },
];

const difficulties = [{ text: t('filter.all'), value: '' }, ...Array.from({ length: 10 }, (_, i) => ({ text: String(i + 1), value: String(i + 1) }))];
const locations = [{ text: t('filter.all'), value: '' }, { text: 'Hanau', value: 'Hanau' }, { text: 'Gelnhausen', value: 'Gelnhausen' }];
const types = [{ text: t('routes.types.boulder'), value: 'Boulder' }, { text: t('filter.all'), value: '' }, { text: t('routes.types.route'), value: 'Route' }];

const pbFilter = computed(() => {
  const parts = ['archived = false'];
  if (selectedDifficulty.value) parts.push(`difficulty = ${Number(selectedDifficulty.value)}`);
  if (selectedLocation.value) parts.push(`location = "${selectedLocation.value}"`);
  if (selectedType.value) parts.push(`type = "${selectedType.value}"`);
  if (searchRouteName.value.trim()) {
    const term = searchRouteName.value.replace(/"/g, '\\"');
    parts.push(`name ~ "${term}"`);
  }
  return parts.join(' && ');
});

function toPbSort(sortByArr) {
  if (!Array.isArray(sortByArr) || !sortByArr.length) return '-screw_date';
  return sortByArr.map(s => (s.order === 'desc' ? `-${s.key}` : s.key)).join(',');
}

async function loadRoutes(options = {}, { append = false } = {}) {
  loading.value = true;
  if (options.page) tableOptions.page = options.page;
  if (options.itemsPerPage) tableOptions.itemsPerPage = options.itemsPerPage;
  if (options.sortBy) tableOptions.sortBy = options.sortBy;

  const sort = toPbSort(tableOptions.sortBy);
  try {
    const res = await pb.collection('routes').getList(
      tableOptions.page,
      tableOptions.itemsPerPage,
      { filter: pbFilter.value, sort }
    );

    const routeIds = res.items.map(r => r.id);
    let ratedRouteIds = new Set();
    if (routeIds.length > 0) {
      const ratingsFilter = routeIds.map(id => `route_id = "${id}"`).join(' || ');
      const ratingsRecords = await pb.collection('ratings').getFullList({
          filter: ratingsFilter,
          fields: 'route_id'
      });
      ratedRouteIds = new Set(ratingsRecords.map(r => r.route_id));
    }

    const newRoutes = res.items.map(route => ({
      ...route,
      has_ratings: ratedRouteIds.has(route.id)
    }));

    if (append) {
      routes.value.push(...newRoutes);
    } else {
      routes.value = newRoutes;
    }
    totalItems.value = res.totalItems;
  } catch (error) {
    console.error("Failed to load routes:", error);
  } finally {
    loading.value = false;
  }
}

function loadMore() {
  tableOptions.page++;
  loadRoutes({}, { append: true });
}

let debounceT = null;
watch([selectedDifficulty, selectedLocation, selectedType, searchRouteName], () => {
  clearTimeout(debounceT);
  debounceT = setTimeout(() => {
    tableOptions.page = 1;
    loadRoutes({}, { append: false });
  }, 300);
});

let unsub = null;
onMounted(async () => {
  await loadRoutes({ ...tableOptions });
  unsub = await pb.collection('routes').subscribe('*', () => {
    tableOptions.page = 1;
    loadRoutes({}, { append: false });
  });
});
onBeforeUnmount(() => unsub && unsub());

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('de-DE');
}

function formatDifficulty(item) {
  let sign = '';
  if (item.difficulty_sign === true) sign = '+';
  else if (item.difficulty_sign === false) sign = '-';
  return `${item.difficulty} ${sign}`.trim();
}
</script>

<style scoped>
.route-name {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.route-comment {
  min-width: 200px;
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.creator-chips {
  max-height: 40px;
  overflow: hidden;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.mobile-route-card {
  position: relative;
  overflow: hidden;
}
.route-difficulty-display {
  position: absolute;
  top: 8px;
  right: 12px;
  z-index: 1;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>