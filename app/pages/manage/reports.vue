<template>
    <v-container class="reports-page">
        <LayoutPageHeader
            :title="t('reports.title')"
            :subtitle="t('reports.subtitle')"
        />

        <v-alert
            v-if="!mailConfigured"
            type="warning"
            variant="tonal"
            icon="mdi-email-off-outline"
            class="mb-4"
            data-testid="reports-mail-warning"
        >
            <div class="d-flex flex-wrap align-center ga-2">
                <span style="flex: 1 1 16rem">{{
                    t('reports.mailWarning')
                }}</span>
                <v-btn
                    variant="text"
                    size="small"
                    to="/admin/settings"
                    data-testid="reports-mail-warning-link"
                >
                    {{ t('reports.mailWarningAction') }}
                </v-btn>
            </div>
        </v-alert>

        <FilterBar
            v-model="search"
            :search-label="t('reports.title')"
            :active-filter-count="statusFilter ? 1 : 0"
            @clear="clearFilters"
        >
            <template #filters>
                <v-row density="comfortable">
                    <v-col cols="12" sm="6" md="4">
                        <v-select
                            v-model="statusFilter"
                            :items="statusItems"
                            item-title="title"
                            item-value="value"
                            :label="t('reports.filterStatus')"
                            density="compact"
                            hide-details="auto"
                            clearable
                            data-testid="reports-filter-status"
                        />
                    </v-col>
                </v-row>
            </template>
        </FilterBar>

        <div class="mt-4">
            <template v-if="loading">
                <v-skeleton-loader
                    v-for="i in 3"
                    :key="i"
                    type="list-item-avatar-three-line, actions"
                    class="mb-3"
                    rounded="lg"
                    data-testid="reports-skeleton"
                />
            </template>

            <LayoutEmptyState
                v-if="!loading && !reports.length"
                icon="mdi-flag-outline"
                :title="t('reports.empty')"
                :hint="t('reports.emptyHint')"
            />

            <ReportsCard
                v-for="report in loading ? [] : reports"
                :key="report.id"
                :report="report"
                class="mb-3"
                @decide="openDecision"
            />

            <div v-if="hasMore" class="text-center mt-4">
                <v-btn
                    variant="tonal"
                    :loading="loadingMore"
                    data-testid="reports-load-more"
                    @click="loadMore"
                >
                    {{ t('actions.load_more') }}
                </v-btn>
            </div>
        </div>

        <LayoutDialogShell
            v-model="decisionDialog"
            max-width="520"
            closable
            :title="t('reports.decideTitle')"
            data-testid="report-decision-dialog"
        >
            <p class="text-body-medium mb-3">
                {{
                    pendingDecision === 'content_removed'
                        ? t('reports.decision.content_removed')
                        : t('reports.decision.content_kept')
                }}
            </p>
            <v-textarea
                v-model="decisionReason"
                :label="t('reports.decisionReason')"
                :hint="t('reports.decisionReasonHint')"
                persistent-hint
                rows="3"
                auto-grow
                counter="2000"
                density="comfortable"
                data-testid="report-decision-reason"
            />
            <template #actions>
                <v-btn
                    variant="text"
                    data-testid="report-decision-cancel"
                    @click="decisionDialog = false"
                >
                    {{ t('actions.cancel') }}
                </v-btn>
                <v-spacer />
                <v-btn
                    :loading="deciding"
                    :color="
                        pendingDecision === 'content_removed'
                            ? 'error'
                            : 'primary'
                    "
                    variant="flat"
                    data-testid="report-decision-confirm"
                    @click="confirmDecision"
                >
                    {{ t('actions.save') }}
                </v-btn>
            </template>
        </LayoutDialogShell>
    </v-container>
</template>

<script setup lang="ts">
import type { ListResult, ReportDecision, ReportRecord } from '~/types/models'
import { REPORT_STATUSES } from '~/utils/reports'

const { t } = useI18n()
const pb = usePocketbase()
const { notify, error: notifyError } = useNotification()

const PER_PAGE = 48

const loading = ref(true)
const loadingMore = ref(false)
const deciding = ref(false)

const reports = ref<ReportRecord[]>([])
const page = ref(1)
const totalItems = ref(0)
const hasMore = computed(() => reports.value.length < totalItems.value)

const pageRoute = useRoute()
const search = ref(String(pageRoute.query.search ?? ''))
watch(
    () => pageRoute.query.search,
    (value) => (search.value = String(value ?? '')),
)
const statusFilter = ref<string | null>(null)

const decisionDialog = ref(false)
const decisionReason = ref('')
const pendingDecision = ref<ReportDecision | null>(null)
const pendingReport = ref<ReportRecord | null>(null)

const statusItems = computed(() =>
    REPORT_STATUSES.map((value) => ({
        value,
        title: t(`reports.status.${value}`),
    })),
)

function buildFilter() {
    const parts: string[] = []
    if (statusFilter.value) parts.push(`status = "${statusFilter.value}"`)
    const term = search.value.trim()
    if (term) {
        const escaped = term.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
        parts.push(
            `(explanation ~ "${escaped}" || notifier_name ~ "${escaped}" || content_snapshot ~ "${escaped}")`,
        )
    }
    return parts.join(' && ')
}

async function fetchList(target = 1) {
    const result = (await pb
        .collection('reports')
        .getList<ReportRecord>(target, PER_PAGE, {
            sort: '-created',
            filter: buildFilter(),
            requestKey: 'reportsList',
        })) as ListResult<ReportRecord>

    totalItems.value = result.totalItems
    reports.value =
        target === 1 ? result.items : [...reports.value, ...result.items]
    page.value = target
    return result
}

const { data: mailStatus } = useMailStatus()
const mailConfigured = computed(() => mailStatus.value?.configured !== false)

const { data: initial } = await useAsyncData('admin-reports', async () => {
    await fetchList(1)
    return { reports: reports.value, totalItems: totalItems.value }
})
if (initial.value) {
    reports.value = initial.value.reports
    totalItems.value = initial.value.totalItems
}
loading.value = false

useHead({
    title: t('page.title.reports'),
    meta: [{ name: 'description', content: t('page.content.reports') }],
})

definePageMeta({
    middleware: ['auth'],
    requiredPermission: 'manage_reports',
})

let searchDebounce: ReturnType<typeof setTimeout> | undefined

watch(search, () => {
    clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => void reload(), 300)
})

watch(statusFilter, () => void reload())

onBeforeUnmount(() => clearTimeout(searchDebounce))

async function reload() {
    loading.value = true
    try {
        await fetchList(1)
    } catch (err) {
        console.error('Failed to load reports:', err)
        notifyError(t('notifications.error.generic'))
    } finally {
        loading.value = false
    }
}

async function loadMore() {
    loadingMore.value = true
    try {
        await fetchList(page.value + 1)
    } catch (err) {
        console.error('Failed to load more reports:', err)
        notifyError(t('notifications.error.generic'))
    } finally {
        loadingMore.value = false
    }
}

function clearFilters() {
    statusFilter.value = null
}

function openDecision(report: ReportRecord, decision: ReportDecision) {
    pendingReport.value = report
    pendingDecision.value = decision
    decisionReason.value = ''
    decisionDialog.value = true
}

async function confirmDecision() {
    const report = pendingReport.value
    const decision = pendingDecision.value
    if (!report || !decision) return

    deciding.value = true
    try {
        if (decision === 'content_removed') {
            const collection =
                report.content_type === 'route' ? 'routes' : 'ratings'
            try {
                await pb.collection(collection).delete(report.content_id)
            } catch (err) {
                if ((err as { status?: number })?.status !== 404) throw err
            }
        }

        const updated = await pb
            .collection('reports')
            .update<ReportRecord>(report.id, {
                status:
                    decision === 'content_removed' ? 'actioned' : 'rejected',
                decision,
                decision_reason: decisionReason.value.trim(),
                decided_at: new Date().toISOString(),
                decided_by: pb.authStore.record?.id ?? null,
            })

        const index = reports.value.findIndex((r) => r.id === report.id)
        if (index !== -1) reports.value[index] = updated

        decisionDialog.value = false
        notify(t('reports.decided'))
    } catch (err) {
        console.error('Failed to record report decision:', err)
        notifyError(t('notifications.error.generic'))
    } finally {
        deciding.value = false
    }
}
</script>
