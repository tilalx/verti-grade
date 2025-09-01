<template>
  <v-app>
    <v-main>
      <v-container>

        <!-- Filters -->
        <v-row>
          <v-col cols="6" sm="3">
            <v-text-field
              :id="routeNameId"
              :label="$t('climbing.searchRouteName')"
              v-model="searchRouteName"
              class="mt-2"
              density="comfortable"
              hide-details
            />
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
              density="comfortable"
              hide-details
            />
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
              density="comfortable"
              hide-details
            />
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
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>

        <!-- Skeleton (no CLS on first load) -->
        <v-skeleton-loader
          v-if="loading && routes.length === 0"
          type="table"
          class="mt-4"
          :elevation="0"
        />

        <!-- Server-side table (no inner scroll, uses footer) -->
        <v-data-table-server
          v-else
          class="mt-4"
          :headers="headersToUse"
          :items="routes"
          :items-length="totalItems"
          :loading="loading"
          :page="tableOptions.page"
          :items-per-page="tableOptions.itemsPerPage"
          :sort-by="tableOptions.sortBy"
          item-value="id"
          density="comfortable"
          :show-expand="smAndDown"
          :expand-on-click="smAndDown"
          v-model:expanded="expanded"
          @update:options="loadRoutes"
        >
          <!-- Per-cell slots (required to keep expand working) -->
          <template #item.color="{ item }">
            <v-avatar :color="item.color" size="30" />
          </template>

          <template #item.name="{ item }">
            <div style="min-width:160px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              {{ item.name }}
            </div>
          </template>

          <template #item.difficulty="{ item }">
            <span>
              {{ item.difficulty }}
              {{ item.difficulty_sign === true ? '+' : item.difficulty_sign === false ? '-' : '' }}
            </span>
          </template>

          <!-- Desktop-only columns (moved to expanded on mobile) -->
          <template v-if="!smAndDown" #item.comment="{ item }">
            <div style="min-width:200px;max-width:420px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              {{ item.comment }}
            </div>
          </template>

          <template v-if="!smAndDown" #item.creator="{ item }">
            <div class="d-flex ga-1 flex-wrap" style="max-height:40px;overflow:hidden">
              <v-chip v-for="c in item.creator" :key="c" size="small">{{ c }}</v-chip>
            </div>
          </template>

          <template v-if="!smAndDown" #item.screw_date="{ item }">
            {{ formatDate(item.screw_date) }}
          </template>

          <template #item.actions="{ item }">
            <RouteDetails :route_id="item.id" />
          </template>

          <!-- Expanded row for MOBILE -->
          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length">
                <div class="pa-3 d-flex flex-column ga-3">
                  <div>
                    <strong>{{ $t('climbing.comment') }}:</strong>
                    <div class="mt-1">{{ item.comment || '—' }}</div>
                  </div>
                  <div>
                    <strong>{{ $t('climbing.creators') }}:</strong>
                    <div class="d-flex ga-1 flex-wrap mt-1">
                      <v-chip v-for="c in item.creator" :key="c" size="small">{{ c }}</v-chip>
                    </div>
                  </div>
                  <div>
                    <strong>{{ $t('table.created_at') }}:</strong>
                    <div class="mt-1">{{ formatDate(item.screw_date) || '—' }}</div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table-server>

      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
/**
 * Assumes you have:
 * - Vuetify plugin installed
 * - i18n with keys used below
 * - PocketBase composable `usePocketbase()`
 */
const { t } = useI18n()
const pb = usePocketbase()
const { smAndDown } = useDisplay()

useHead({
  title: t('page.title.index'),
  meta: [{ name: 'description', content: t('page.content.index'), authRequired: false }],
})

// Stable IDs for a11y (SSR-safe)
const routeNameId = useId()
const difficultyId = useId()
const typeId = useId()
const locationId = useId()

/** Filters */
const selectedDifficulty = ref('')
const selectedLocation   = ref('')
const selectedType       = ref('')
const searchRouteName    = ref('')

/** Server table state */
const tableOptions = reactive({
  page: 1,
  itemsPerPage: 50,
  // Vuetify expects: [{ key: 'field', order: 'asc'|'desc' }]
  sortBy: [{ key: 'screw_date', order: 'desc' }],
})

/** Data state */
const loading    = ref(false)
const routes     = ref([])
const totalItems = ref(0)
const expanded   = ref([]) // holds expanded row ids (mobile)

/** Headers */
const headersDesktop = [
  { title: t('climbing.color'),    key: 'color' },
  { title: t('climbing.routename'),key: 'name' },
  { title: t('climbing.difficulty'), key: 'difficulty' },
  { title: t('climbing.comment'),  key: 'comment' },
  { title: t('climbing.creators'), key: 'creator' },
  { title: t('table.created_at'),  key: 'screw_date' },
  { title: t('table.actions'),     key: 'actions', sortable: false },
]

const headersMobile = [
  { title: t('climbing.color'),    key: 'color' },
  { title: t('climbing.routename'),key: 'name' },
  { title: t('climbing.difficulty'), key: 'difficulty' },
  { title: t('table.actions'),     key: 'actions', sortable: false },
]

const headersToUse = computed(() => smAndDown.value ? headersMobile : headersDesktop)

/** Filter lists */
const difficulties = [
  { text: t('filter.all'), value: '' },
  ...Array.from({ length: 10 }, (_, i) => ({ text: String(i + 1), value: String(i + 1) })),
]

const locations = [
  { text: t('filter.all'), value: '' },
  { text: 'Hanau', value: 'Hanau' },
  { text: 'Gelnhausen', value: 'Gelnhausen' },
]

const types = [
  { text: t('routes.types.boulder'), value: 'Boulder' },
  { text: t('filter.all'),           value: '' },
  { text: t('routes.types.route'),   value: 'Route' },
]

/** Build PocketBase filter */
const pbFilter = computed(() => {
  const parts = ['archived = false']
  if (selectedDifficulty.value) parts.push(`difficulty = ${Number(selectedDifficulty.value)}`)
  if (selectedLocation.value)   parts.push(`location = "${selectedLocation.value}"`)
  if (selectedType.value)       parts.push(`type = "${selectedType.value}"`)
  if (searchRouteName.value.trim()) {
    const term = searchRouteName.value.replace(/"/g, '\\"')
    parts.push(`name ~ "${term}"`)
  }
  return parts.join(' && ')
})

/** Map Vuetify sort -> PB sort string */
function toPbSort(sortByArr) {
  if (!Array.isArray(sortByArr) || !sortByArr.length) return '-screw_date'
  return sortByArr.map(s => (s.order === 'desc' ? `-${s.key}` : s.key)).join(',')
}

/** Core loader; invoked on init and any table/filter changes */
async function loadRoutes(options) {
  loading.value = true

  // sync local state with table options
  if (options) {
    tableOptions.page         = options.page
    tableOptions.itemsPerPage = options.itemsPerPage
    tableOptions.sortBy       = options.sortBy
  }

  const sort = toPbSort(tableOptions.sortBy)

  const res = await pb.collection('routes').getList(
    tableOptions.page,
    tableOptions.itemsPerPage,
    { filter: pbFilter.value, sort }
  )

  routes.value     = res.items
  totalItems.value = res.totalItems ?? res.total ?? 0
  loading.value    = false
}

/** Initial load */
onMounted(() => { loadRoutes({ ...tableOptions }) })

/** Debounce filters -> reset page -> reload */
let debounceT = null
watch([selectedDifficulty, selectedLocation, selectedType, searchRouteName], () => {
  if (debounceT) clearTimeout(debounceT)
  debounceT = setTimeout(() => {
    tableOptions.page = 1
    expanded.value = [] // collapse expanded rows after filter change
    loadRoutes({ ...tableOptions })
  }, 220)
})

/** Live updates from PocketBase (optional) */
let unsub = null
onMounted(async () => {
  unsub = await pb.collection('routes').subscribe('*', async () => {
    await loadRoutes({ ...tableOptions })
  })
})
onBeforeUnmount(() => { if (unsub) unsub() })

/** Utils */
function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}
</script>

<style scoped>
/* stabilize control heights & chips to avoid tiny reflows */
:deep(.v-field){ min-height: 40px; }
:deep(.v-chip){ line-height: 20px; }
</style>