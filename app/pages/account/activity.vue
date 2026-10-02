<template>
    <div class="activity-page mx-auto w-full px-4">
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
                <div class="contents">
                    <FilterSelect
                        :label="t('audit.filterAction')"
                        v-model="actionFilter"
                        :items="actionItems"
                        label-key="title"
                        value-key="value"
                        clear
                        :placeholder="t('filter.all')"
                        data-testid="audit-filter-action"
                    />
                    <FilterSelect
                        :label="t('audit.filterCollection')"
                        v-model="collectionFilter"
                        :items="collectionItems"
                        label-key="title"
                        value-key="value"
                        clear
                        :placeholder="t('filter.all')"
                        data-testid="audit-filter-collection"
                    />
                    <FilterSelect
                        :label="t('audit.filterPeriod')"
                        v-model="periodFilter"
                        :items="periodItems"
                        label-key="title"
                        value-key="value"
                        data-testid="audit-filter-period"
                    />
                </div>
            </template>
        </FilterBar>

        <div class="mt-4">
            <LayoutLoadingState v-if="loading" />

            <LayoutEmptyState
                v-if="!loading && !entries.length"
                icon="i-lucide-clipboard-clock"
                :title="t('audit.empty')"
                :hint="t('audit.emptyHint')"
            />

            <AuditCard
                v-for="entry in loading ? [] : entries"
                :key="entry.id"
                :entry="entry"
                class="mb-2"
            />

            <div v-if="hasMore" class="text-center mt-4">
                <UButton
                    color="neutral"
                    variant="soft"
                    :loading="loadingMore"
                    data-testid="audit-load-more"
                    @click="loadMore"
                >
                    {{ t('actions.load_more') }}
                </UButton>
            </div>

            <p
                class="text-xs text-muted text-center mt-6"
                data-testid="audit-retention-note"
            >
                {{
                    t(
                        'audit.retentionNote',
                        { days: retentionDays },
                        retentionDays,
                    )
                }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { AuditAction, AuditLogRecord, ListResult } from '~/types/models'
import {
    AUDIT_ACTIONS,
    AUDIT_PERIODS,
    AUDITED_COLLECTIONS,
    buildAuditFilter,
    type AuditPeriod,
} from '~/utils/audit'

const { t } = useI18n()
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

const { data: settings } = useNuxtData('settings')
const retentionDays = computed(() => settings.value?.audit_retention_days ?? 90)

const { subscribe } = usePbSubscription()

onMounted(async () => {
    await subscribe('audit_logs', (e) => {
        if (e.action !== 'create' || !e.record) return
        if (page.value !== 1) return
        if (!matchesFilters(e.record)) return
        if (entries.value.some((entry) => entry.id === e.record.id)) return
        entries.value = [e.record as AuditLogRecord, ...entries.value]
        totalItems.value += 1
    })
})

function matchesFilters(record: AuditLogRecord) {
    if (actionFilter.value && record.action !== actionFilter.value) return false
    if (
        collectionFilter.value &&
        record.collection_name !== collectionFilter.value
    ) {
        return false
    }
    const term = search.value.trim().toLowerCase()
    if (!term) return true
    return [record.actor_label, record.record_id, record.collection_name].some(
        (value) => (value ?? '').toLowerCase().includes(term),
    )
}

useHead({
    title: t('page.title.activity'),
    meta: [{ name: 'description', content: t('page.content.activity') }],
})

definePageMeta({
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
