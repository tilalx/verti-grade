<template>
    <v-container class="activity-page">
        <LayoutPageHeader
            :title="seesEverything ? t('audit.title') : t('audit.titleOwn')"
            :subtitle="
                seesEverything ? t('audit.subtitle') : t('audit.subtitleOwn')
            "
        />

        <FilterBar
            v-model="search"
            :search-label="t('audit.searchLabel')"
            :active-filter-count="activeFilterCount"
            @clear="clearFilters"
        >
            <template #filters>
                <v-row density="comfortable">
                    <v-col cols="12" sm="6" md="4">
                        <v-select
                            v-model="actionFilter"
                            :items="actionItems"
                            item-title="title"
                            item-value="value"
                            :label="t('audit.filterAction')"
                            density="compact"
                            hide-details="auto"
                            clearable
                            data-testid="audit-filter-action"
                        />
                    </v-col>
                    <v-col cols="12" sm="6" md="4">
                        <v-select
                            v-model="collectionFilter"
                            :items="collectionItems"
                            item-title="title"
                            item-value="value"
                            :label="t('audit.filterCollection')"
                            density="compact"
                            hide-details="auto"
                            clearable
                            data-testid="audit-filter-collection"
                        />
                    </v-col>
                    <v-col cols="12" sm="6" md="4">
                        <v-select
                            v-model="periodFilter"
                            :items="periodItems"
                            item-title="title"
                            item-value="value"
                            :label="t('audit.filterPeriod')"
                            density="compact"
                            hide-details="auto"
                            data-testid="audit-filter-period"
                        />
                    </v-col>
                </v-row>
            </template>
        </FilterBar>

        <div class="mt-4">
            <v-progress-linear v-if="loading" indeterminate class="mb-4" />

            <LayoutEmptyState
                v-if="!loading && !entries.length"
                icon="mdi-clipboard-text-clock-outline"
                :title="t('audit.empty')"
                :hint="t('audit.emptyHint')"
            />

            <v-card v-else-if="entries.length" variant="outlined">
                <v-list density="comfortable" class="py-0">
                    <template v-for="(entry, i) in entries" :key="entry.id">
                        <v-divider v-if="i > 0" />
                        <v-list-item
                            class="py-3"
                            :data-testid="`audit-row-${entry.id}`"
                        >
                            <template #prepend>
                                <v-chip
                                    :color="actionColor(entry.action)"
                                    size="small"
                                    variant="tonal"
                                    class="mr-3 audit-action-chip"
                                    data-testid="audit-row-action"
                                >
                                    {{ t(`audit.action.${entry.action}`) }}
                                </v-chip>
                            </template>

                            <v-list-item-title
                                class="text-body-medium"
                                data-testid="audit-row-actor"
                            >
                                {{ actorName(entry) }}
                            </v-list-item-title>

                            <v-list-item-subtitle
                                class="d-flex flex-wrap align-center ga-1 mt-1"
                            >
                                <span v-if="entry.collection_name">
                                    {{ collectionName(entry.collection_name) }}
                                </span>
                                <NuxtLink
                                    v-if="targetUrl(entry)"
                                    :to="targetUrl(entry) ?? undefined"
                                    class="audit-target"
                                    data-testid="audit-row-target"
                                >
                                    {{ entry.record_id }}
                                </NuxtLink>
                                <code v-else-if="entry.record_id">{{
                                    entry.record_id
                                }}</code>
                                <v-chip
                                    v-for="field in entry.changed_fields ?? []"
                                    :key="field"
                                    size="x-small"
                                    variant="outlined"
                                    data-testid="audit-row-field"
                                >
                                    {{ field }}
                                </v-chip>
                            </v-list-item-subtitle>

                            <template #append>
                                <div class="text-right">
                                    <div class="text-caption">
                                        {{ formatTime(entry.created) }}
                                    </div>
                                    <div
                                        v-if="entry.ip"
                                        class="text-caption text-medium-emphasis"
                                    >
                                        {{ entry.ip }}
                                    </div>
                                </div>
                            </template>
                        </v-list-item>
                    </template>
                </v-list>
            </v-card>

            <div v-if="hasMore" class="text-center mt-4">
                <v-btn
                    variant="tonal"
                    :loading="loadingMore"
                    data-testid="audit-load-more"
                    @click="loadMore"
                >
                    {{ t('actions.load_more') }}
                </v-btn>
            </div>

            <!-- Art. 13(2)(a): the retention period is something you have to
                 tell people, so tell them here rather than only in a policy. -->
            <p
                class="text-caption text-medium-emphasis text-center mt-6"
                data-testid="audit-retention-note"
            >
                {{ t('audit.retentionNote', { days: retentionDays }) }}
            </p>
        </div>
    </v-container>
</template>

<script setup lang="ts">
import type { AuditAction, AuditLogRecord, ListResult } from '~/types/models'
import {
    AUDIT_ACTIONS,
    AUDIT_PERIODS,
    AUDITED_COLLECTIONS,
    actionColor,
    auditTargetUrl,
    buildAuditFilter,
    isSuperuserEntry,
    type AuditPeriod,
} from '~/utils/audit'

const { t, te } = useI18n()
const pb = usePocketbase()
const { can } = usePermissions()

const PER_PAGE = 48

const loading = ref(true)
const loadingMore = ref(false)

const entries = ref<AuditLogRecord[]>([])
const page = ref(1)
const totalItems = ref(0)
const hasMore = computed(() => entries.value.length < totalItems.value)

const search = ref('')
const actionFilter = ref<AuditAction | null>(null)
const collectionFilter = ref<string | null>(null)
const periodFilter = ref<AuditPeriod>('30d')

// One page for two audiences. The collection's list rule already decides what
// comes back -- everything for a view_audit_log holder, your own entries for
// everyone else -- so the page only has to say which of the two it is showing.
const seesEverything = computed(() => can('view_audit_log'))

const activeFilterCount = computed(
    () =>
        (actionFilter.value ? 1 : 0) +
        (collectionFilter.value ? 1 : 0) +
        (periodFilter.value !== '30d' ? 1 : 0),
)

const actionItems = computed(() =>
    AUDIT_ACTIONS.map((value) => ({
        value,
        title: t(`audit.action.${value}`),
    })),
)
const collectionItems = computed(() =>
    AUDITED_COLLECTIONS.map((value) => ({
        value,
        title: t(`audit.collection.${value}`),
    })),
)
const periodItems = computed(() =>
    AUDIT_PERIODS.map((value) => ({
        value,
        title: t(`audit.period.${value}`),
    })),
)

function collectionName(name: string) {
    return te(`audit.collection.${name}`) ? t(`audit.collection.${name}`) : name
}

function actorName(entry: AuditLogRecord) {
    if (isSuperuserEntry(entry)) return t('audit.superuser')
    return entry.actor_label || t('audit.anonymous')
}

// formatDisplayDate drops the time, and for an audit entry the time is half
// the information.
function formatTime(value?: string | null) {
    if (!value) return ''
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleString()
}

function targetUrl(entry: AuditLogRecord) {
    return auditTargetUrl(entry.collection_name, entry.record_id)
}

async function fetchList(target = 1) {
    const result = (await pb
        .collection('audit_logs')
        .getList<AuditLogRecord>(target, PER_PAGE, {
            sort: '-created',
            filter: buildAuditFilter({
                search: search.value,
                action: actionFilter.value,
                collection: collectionFilter.value,
                period: periodFilter.value,
            }),
            requestKey: 'auditList',
        })) as ListResult<AuditLogRecord>

    totalItems.value = result.totalItems
    entries.value =
        target === 1 ? result.items : [...entries.value, ...result.items]
    page.value = target
    return result
}

const { data: initial } = await useAsyncData('activity-log', async () => {
    await fetchList(1)
    return { entries: entries.value, totalItems: totalItems.value }
})
if (initial.value) {
    entries.value = initial.value.entries
    totalItems.value = initial.value.totalItems
}
loading.value = false

// The layout already loaded settings under this key; read the cache rather
// than fetching the singleton a second time.
const { data: settings } = useNuxtData('settings')
const retentionDays = computed(() => settings.value?.audit_retention_days ?? 90)

useHead({
    title: t('page.title.activity'),
    meta: [{ name: 'description', content: t('page.content.activity') }],
})

definePageMeta({
    authRequired: true,
    middleware: ['auth'],
})

let searchDebounce: ReturnType<typeof setTimeout> | undefined

watch(search, () => {
    clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => void reload(), 300)
})

watch([actionFilter, collectionFilter, periodFilter], () => void reload())

onBeforeUnmount(() => clearTimeout(searchDebounce))

async function reload() {
    loading.value = true
    try {
        await fetchList(1)
    } catch (err) {
        console.error('Failed to load audit log:', err)
    } finally {
        loading.value = false
    }
}

async function loadMore() {
    loadingMore.value = true
    try {
        await fetchList(page.value + 1)
    } catch (err) {
        console.error('Failed to load more audit entries:', err)
    } finally {
        loadingMore.value = false
    }
}

function clearFilters() {
    actionFilter.value = null
    collectionFilter.value = null
    periodFilter.value = '30d'
}
</script>

<style scoped>
.audit-action-chip {
    min-width: 6.5rem;
    justify-content: center;
}

.audit-target {
    color: inherit;
}
</style>
