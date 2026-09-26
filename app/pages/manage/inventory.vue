<template>
    <v-container class="inventory-page pa-0">
        <div class="inventory-layout">
            <div
                class="inventory-layout__controls"
                data-testid="inventory-controls"
            >
                <div
                    v-if="cameraActive"
                    ref="viewportRef"
                    class="scanner-viewport"
                >
                    <QrStream
                        :formats="['QRCode']"
                        :constraints="cameraConstraints"
                        :tag="codeTag"
                        @detect="onDetect"
                        @camera-on="onCameraOn"
                        @error="onCameraError"
                    />
                    <v-btn
                        v-if="scanning && torchSupported"
                        class="scanner-viewport__torch"
                        :icon="
                            torchOn ? 'mdi-flashlight' : 'mdi-flashlight-off'
                        "
                        :color="torchOn ? 'warning' : undefined"
                        variant="flat"
                        size="small"
                        :aria-label="$t('inventory.toggleTorch')"
                        data-testid="inventory-torch"
                        @click="toggleTorch"
                    />
                </div>

                <div class="px-4 pt-3">
                    <div class="d-flex align-center ga-2">
                        <h1 class="inventory-title text-truncate">
                            {{ $t('inventory.title') }}
                        </h1>

                        <v-spacer />

                        <v-btn
                            icon="mdi-refresh"
                            variant="text"
                            size="small"
                            :disabled="
                                scannedRouteIds.length === 0 && !scanning
                            "
                            :aria-label="$t('inventory.reset')"
                            data-testid="inventory-reset"
                            @click="resetDialog = true"
                        />
                        <v-btn
                            icon="mdi-information-outline"
                            variant="text"
                            size="small"
                            :aria-label="$t('inventory.showInstructions')"
                            @click="instructionsDialog = true"
                        />
                    </div>

                    <div class="d-flex flex-wrap align-center ga-3">
                        <div
                            v-if="!locationLocked"
                            class="d-flex ga-1"
                            role="group"
                            :aria-label="$t('inventory.locationLabel')"
                            data-testid="inventory-location"
                        >
                            <v-btn
                                v-for="item in locationItems"
                                :key="item.value"
                                size="small"
                                rounded="lg"
                                :variant="
                                    sessionLocation === item.value
                                        ? 'flat'
                                        : 'outlined'
                                "
                                :color="
                                    sessionLocation === item.value
                                        ? 'primary'
                                        : undefined
                                "
                                :data-testid="`inventory-location-${item.title}`"
                                @click="sessionLocation = item.value"
                            >
                                {{ item.title }}
                            </v-btn>
                        </div>
                        <v-chip
                            v-else
                            color="primary"
                            variant="tonal"
                            size="small"
                            closable
                            close-label="inventory.changeLocation"
                            data-testid="inventory-change-location"
                            @click:close="resetDialog = true"
                        >
                            {{ sessionLocationName }}
                        </v-chip>

                        <div class="progress-group d-flex align-center ga-2">
                            <v-progress-linear
                                :model-value="progress"
                                color="success"
                                height="6"
                                rounded
                                class="flex-grow-1"
                            />
                            <span
                                class="text-body-small text-medium-emphasis flex-shrink-0"
                                data-testid="inventory-progress"
                            >
                                {{ foundRoutes.length }}/{{ scoped.length }}
                            </span>
                        </div>
                    </div>

                    <p
                        v-if="!sessionLocation"
                        class="text-body-small text-medium-emphasis mt-2 mb-0"
                    >
                        {{
                            restoredUnscoped
                                ? $t('inventory.locationRestoreHint')
                                : $t('inventory.locationHint')
                        }}
                    </p>
                </div>

                <div v-if="scannerError" class="px-4 pt-3">
                    <v-alert
                        type="error"
                        density="compact"
                        closable
                        data-testid="inventory-scanner-error"
                        @click:close="scannerError = ''"
                    >
                        {{ scannerError }}
                    </v-alert>
                </div>

                <div class="d-flex ga-2 px-4 pt-3">
                    <v-btn
                        v-if="!scanning"
                        color="primary"
                        class="flex-1-1"
                        :disabled="loadingRoutes || !sessionLocation"
                        :loading="loadingRoutes"
                        prepend-icon="mdi-camera"
                        data-testid="inventory-start"
                        @click="startScanner()"
                    >
                        {{ $t('inventory.start') }}
                    </v-btn>
                    <v-btn
                        v-else
                        color="warning"
                        class="flex-1-1"
                        prepend-icon="mdi-stop-circle"
                        data-testid="inventory-stop"
                        @click="stopScanner()"
                    >
                        {{ $t('inventory.stop') }}
                    </v-btn>
                    <v-btn
                        v-if="scannedRouteIds.length > 0"
                        color="primary"
                        variant="tonal"
                        class="flex-1-1"
                        :disabled="loadingRoutes || !sessionLocation"
                        prepend-icon="mdi-check"
                        data-testid="inventory-finish-open"
                        @click="openFinishDialog()"
                    >
                        {{ $t('inventory.finish') }}
                    </v-btn>
                </div>

                <div
                    v-if="unlocatedCount > 0"
                    class="px-4 pt-2 text-body-small text-medium-emphasis"
                    data-testid="inventory-unlocated-note"
                >
                    {{
                        $t(
                            'inventory.unlocatedNote',
                            { count: unlocatedCount },
                            unlocatedCount,
                        )
                    }}
                </div>
            </div>

            <div class="inventory-layout__lists" data-testid="inventory-lists">
                <v-tabs
                    v-if="!isWideLayout"
                    v-model="activeTab"
                    density="compact"
                    grow
                    class="mt-3"
                    color="primary"
                >
                    <v-tab value="missing" data-testid="inventory-tab-missing">
                        {{ $t('inventory.stillToFind') }}
                        <v-chip
                            size="x-small"
                            variant="tonal"
                            color="warning"
                            class="ml-2"
                            data-testid="inventory-missing-count"
                        >
                            {{ missing.length }}
                        </v-chip>
                    </v-tab>
                    <v-tab value="found" data-testid="inventory-tab-found">
                        {{ $t('inventory.reviewFoundTitle') }}
                        <v-chip
                            size="x-small"
                            variant="tonal"
                            color="success"
                            class="ml-2"
                            data-testid="inventory-found-count"
                        >
                            {{ foundRoutes.length }}
                        </v-chip>
                    </v-tab>
                </v-tabs>

                <v-tabs-window
                    v-if="!isWideLayout"
                    v-model="activeTab"
                    class="px-4 pt-3 pb-6"
                >
                    <v-tabs-window-item value="missing">
                        <InventoryRouteList
                            :routes="missing"
                            mode="missing"
                            empty-icon="mdi-check-all"
                            :empty-title="missingEmptyTitle"
                            @action="markFound"
                        />

                        <v-btn
                            v-if="missing.length"
                            variant="text"
                            size="small"
                            block
                            prepend-icon="mdi-plus"
                            class="mt-2"
                            data-testid="inventory-manual-open"
                            @click="openManualDialog()"
                        >
                            {{ $t('inventory.addManually') }}
                        </v-btn>
                    </v-tabs-window-item>

                    <v-tabs-window-item value="found">
                        <InventoryRouteList
                            :routes="foundRoutes"
                            mode="found"
                            empty-icon="mdi-qrcode-scan"
                            :empty-title="$t('inventory.noScans')"
                            @action="undoScan"
                        />
                    </v-tabs-window-item>
                </v-tabs-window>

                <div v-else class="inventory-columns px-4 pt-1 pb-6">
                    <section
                        class="inventory-column inventory-column--missing"
                        data-testid="inventory-column-missing"
                    >
                        <div class="d-flex align-center ga-2 mb-2">
                            <h2 class="text-title-small font-weight-semibold">
                                {{ $t('inventory.stillToFind') }}
                            </h2>
                            <v-chip
                                size="x-small"
                                variant="tonal"
                                color="warning"
                                data-testid="inventory-missing-count"
                            >
                                {{ missing.length }}
                            </v-chip>
                            <v-spacer />
                            <v-btn
                                v-if="missing.length"
                                variant="text"
                                size="small"
                                prepend-icon="mdi-plus"
                                data-testid="inventory-manual-open"
                                @click="openManualDialog()"
                            >
                                {{ $t('inventory.addManually') }}
                            </v-btn>
                        </div>
                        <InventoryRouteList
                            :routes="missing"
                            mode="missing"
                            empty-icon="mdi-check-all"
                            :empty-title="missingEmptyTitle"
                            @action="markFound"
                        />
                    </section>

                    <section
                        class="inventory-column inventory-column--found"
                        data-testid="inventory-column-found"
                    >
                        <div class="d-flex align-center ga-2 mb-2">
                            <h2 class="text-title-small font-weight-semibold">
                                {{ $t('inventory.reviewFoundTitle') }}
                            </h2>
                            <v-chip
                                size="x-small"
                                variant="tonal"
                                color="success"
                                data-testid="inventory-found-count"
                            >
                                {{ foundRoutes.length }}
                            </v-chip>
                        </div>
                        <InventoryRouteList
                            :routes="foundRoutes"
                            mode="found"
                            empty-icon="mdi-qrcode-scan"
                            :empty-title="$t('inventory.noScans')"
                            @action="undoScan"
                        />
                    </section>
                </div>
            </div>
        </div>

        <LayoutDialogShell
            v-model="instructionsDialog"
            max-width="400"
            closable
            :title="$t('inventory.instructionsTitle')"
        >
            <p class="text-body-medium text-medium-emphasis mb-3">
                {{ $t('inventory.instructionsIntro') }}
            </p>
            <ol class="instructions-list text-body-medium">
                <li>{{ $t('inventory.instructionsStep1') }}</li>
                <li>{{ $t('inventory.instructionsStep2') }}</li>
                <li>{{ $t('inventory.instructionsStep3') }}</li>
            </ol>
            <template #actions>
                <v-spacer />
                <v-btn color="primary" @click="instructionsDialog = false">
                    {{ $t('inventory.instructionsClose') }}
                </v-btn>
            </template>
        </LayoutDialogShell>

        <LayoutDialogShell
            v-model="manualDialog"
            max-width="480"
            closable
            sheet-on-mobile
            :title="$t('inventory.addManuallyTitle')"
            :subtitle="$t('inventory.addManuallyHint')"
            data-testid="inventory-manual-dialog"
        >
            <v-text-field
                v-model="manualSearch"
                :label="$t('inventory.searchRoutes')"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                clearable
                hide-details
                class="mb-3"
                data-testid="inventory-manual-search"
            />
            <v-list
                v-if="manualMatches.length"
                density="compact"
                class="scope-list rounded-lg"
                border
            >
                <v-list-item
                    v-for="route in manualMatches"
                    :key="route.id"
                    :data-testid="`inventory-manual-item-${route.id}`"
                    @click="markFound(route, { closeManual: true })"
                >
                    <template #prepend>
                        <span class="anchor-badge">{{
                            formatAnchorPoint(route.anchor_point)
                        }}</span>
                    </template>
                    <v-list-item-title class="text-body-medium">
                        {{ route.name }}
                    </v-list-item-title>
                    <template #append>
                        <span class="text-body-small text-medium-emphasis">
                            {{ formatDifficulty(route) }}
                        </span>
                    </template>
                </v-list-item>
            </v-list>
            <LayoutEmptyState
                v-else
                :card="false"
                :title="$t('table.no_data')"
            />
        </LayoutDialogShell>

        <LayoutDialogShell
            v-model="finishDialog"
            max-width="480"
            closable
            :title="$t('inventory.reviewTitle')"
            :subtitle="sessionLocation || undefined"
            data-testid="inventory-finish-dialog"
        >
            <div class="text-title-small font-weight-semibold mb-1">
                {{ $t('inventory.reviewMissingTitle') }}
                <v-chip
                    size="x-small"
                    variant="tonal"
                    color="error"
                    class="ml-1"
                >
                    {{ archiveIds.length }}
                </v-chip>
            </div>
            <p
                v-if="missing.length"
                class="text-body-small text-medium-emphasis mb-2"
            >
                {{ $t('inventory.reviewMissingDescription') }}
            </p>
            <v-list density="compact" class="review-list rounded-lg" border>
                <v-list-item
                    v-for="route in missing"
                    :key="`missing-${route.id}`"
                >
                    <template #prepend>
                        <v-checkbox-btn
                            :model-value="archiveSelection.has(route.id)"
                            density="compact"
                            :aria-label="route.name || route.id"
                            :data-testid="`inventory-archive-toggle-${route.id}`"
                            @update:model-value="
                                toggleArchive(route.id, $event)
                            "
                        />
                    </template>
                    <v-list-item-title class="text-body-medium">
                        {{ route.name }}
                    </v-list-item-title>
                    <template #append>
                        <span class="text-body-small text-medium-emphasis">
                            {{ formatDifficulty(route) }}
                        </span>
                    </template>
                </v-list-item>
                <v-list-item v-if="missing.length === 0">
                    <v-list-item-title
                        class="text-body-medium text-medium-emphasis"
                    >
                        {{ $t('inventory.nothingToArchive') }}
                    </v-list-item-title>
                </v-list-item>
            </v-list>

            <p class="text-body-small text-medium-emphasis mt-3 mb-0">
                {{
                    $t('inventory.progress', {
                        found: foundRoutes.length,
                        total: scoped.length,
                    })
                }}
            </p>

            <template #actions>
                <v-btn
                    variant="text"
                    data-testid="inventory-finish-cancel"
                    @click="finishDialog = false"
                >
                    {{ $t('actions.cancel') }}
                </v-btn>
                <v-spacer />
                <v-btn
                    color="warning"
                    prepend-icon="mdi-archive-outline"
                    :loading="archiving"
                    data-testid="inventory-finish-confirm"
                    @click="confirmFinish"
                >
                    {{
                        archiveIds.length
                            ? $t('inventory.archiveSelected', {
                                  count: archiveIds.length,
                              })
                            : $t('inventory.archiveNone')
                    }}
                </v-btn>
            </template>
        </LayoutDialogShell>

        <ConfirmDialog
            v-model="resetDialog"
            :title="$t('inventory.resetTitle')"
            :message="
                $t(
                    'inventory.resetMessage',
                    { count: scannedRouteIds.length },
                    scannedRouteIds.length,
                )
            "
            :confirm-text="$t('inventory.reset')"
            @confirm="confirmReset"
        />
    </v-container>
</template>

<script setup lang="ts">
import {
    formatAnchorPoint,
    formatDifficulty,
    locationName,
} from '#shared/utils/formatting'
import {
    clearSession,
    countUnlocated,
    extractRouteId,
    hasSeenInstructions,
    loadSession,
    markInstructionsSeen,
    missingRoutes,
    persistSession,
    scopedRoutes,
    sortByAnchor,
} from '~/utils/inventory'
import type { RouteRecord } from '~/types/models'

definePageMeta({
    middleware: 'auth',
    requiredPermission: 'run_inventory',
})

const ROUTE_FIELDS =
    'id,name,location,difficulty,difficulty_sign,anchor_point,archived,expand.location.name'
const SCAN_COOLDOWN_MS = 2000

const { t, locale } = useI18n()
const pb = usePocketbase()
const { width: viewportWidth } = useDisplay()
const { data: locationRecords } = useLocations()
const {
    success: notifySuccess,
    error: notifyError,
    warning: notifyWarning,
} = useNotification()

const isWideLayout = computed(() => viewportWidth.value >= 740)

const allRoutes = ref<RouteRecord[]>([])
const loadingRoutes = ref(false)
const scannedRouteIds = ref<string[]>([])
const sessionLocation = ref<string | null>(null)
const restoredUnscoped = ref(false)

const viewportRef = useTemplateRef<HTMLElement>('viewportRef')
const {
    scanning,
    cameraActive,
    torchOn,
    torchSupported,
    scannerError,
    start: startCamera,
    stop: stopScanner,
    toggleTorch,
    onCameraOn,
    onCameraError,
    signalAccepted,
    signalDuplicate,
    signalRejected,
} = useQrScanner(viewportRef, () => t('inventory.cameraError'))

const instructionsDialog = ref(false)
const manualDialog = ref(false)
const manualSearch = ref('')
const finishDialog = ref(false)
const resetDialog = ref(false)
const activeTab = ref<'missing' | 'found'>('missing')
const archiving = ref(false)
const archiveSelection = ref(new Set<string>())

const cameraConstraints = {
    facingMode: 'environment',
    frameRate: { ideal: 60 },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
}

const locationItems = computed(() =>
    (locationRecords.value ?? []).map((location) => ({
        title: location.name,
        value: location.id,
    })),
)

const sessionLocationName = computed(
    () =>
        locationItems.value.find((item) => item.value === sessionLocation.value)
            ?.title ?? '',
)

const locationLocked = computed(
    () => scannedRouteIds.value.length > 0 && !!sessionLocation.value,
)

const locationHint = computed(() =>
    restoredUnscoped.value && !sessionLocation.value
        ? t('inventory.locationRestoreHint')
        : t('inventory.locationHint'),
)

const scoped = computed(() =>
    scopedRoutes(allRoutes.value, sessionLocation.value),
)

const missing = computed(() =>
    missingRoutes(
        allRoutes.value,
        scannedRouteIds.value,
        sessionLocation.value,
    ),
)

const foundRoutes = computed(() => {
    const scanned = new Set(scannedRouteIds.value)
    return sortByAnchor(scoped.value.filter((route) => scanned.has(route.id)))
})

const progress = computed(() =>
    scoped.value.length
        ? (foundRoutes.value.length / scoped.value.length) * 100
        : 0,
)

const unlocatedCount = computed(() => countUnlocated(allRoutes.value))

const missingEmptyTitle = computed(() =>
    sessionLocation.value
        ? t('inventory.allFound')
        : t('inventory.locationRequired'),
)

const manualMatches = computed(() => {
    const term = (manualSearch.value || '').trim().toLowerCase()
    if (!term) return missing.value
    return missing.value.filter((route) =>
        (route.name || '').toLowerCase().includes(term),
    )
})

const archiveIds = computed(() =>
    missing.value
        .map((route) => route.id)
        .filter((id) => archiveSelection.value.has(id)),
)

useHead(() => ({
    title: t('page.title.inventory'),
    meta: [{ name: 'description', content: t('page.content.inventory') }],
}))

// ── Storage ─────────────────────────────────────────────────────────────
let storageWarningShown = false
const warnStorageUnavailable = () => {
    if (storageWarningShown) return
    storageWarningShown = true
    notifyWarning(t('inventory.storageWarning'))
}

const restoreSession = () => {
    try {
        const session = loadSession()
        scannedRouteIds.value = session.ids
        sessionLocation.value = session.location
        restoredUnscoped.value = session.ids.length > 0 && !session.location
    } catch (error) {
        console.warn('Failed to restore inventory session:', error)
        warnStorageUnavailable()
    }
}

watch(
    [scannedRouteIds, sessionLocation],
    () => {
        if (!import.meta.client) return
        try {
            persistSession({
                location: sessionLocation.value,
                ids: scannedRouteIds.value,
            })
        } catch (error) {
            console.warn('Failed to persist inventory session:', error)
            warnStorageUnavailable()
        }
    },
    { flush: 'post' },
)

const reconcileScannedIds = () => {
    if (!allRoutes.value.length) return

    const byId = new Map(allRoutes.value.map((route) => [route.id, route]))
    const resolved = scannedRouteIds.value.filter((id) => byId.has(id))

    const kept = sessionLocation.value
        ? resolved.filter(
              (id) => byId.get(id)?.location === sessionLocation.value,
          )
        : resolved

    const wrongLocation = resolved.length - kept.length
    if (wrongLocation > 0) {
        notifyWarning(
            t(
                'inventory.droppedForLocation',
                { count: wrongLocation },
                wrongLocation,
            ),
        )
    }
    if (kept.length !== scannedRouteIds.value.length) {
        scannedRouteIds.value = kept
    }
    if (sessionLocation.value) restoredUnscoped.value = false
}

watch(sessionLocation, () => reconcileScannedIds())

const acceptingScans = computed(
    () => !finishDialog.value && !manualDialog.value,
)

let routeInfoById = new Map<
    string,
    { name: string; location: string | null; locationName: string }
>()
let scannedIdSet = new Set<string>()
let activeLocation: string | null = null
let tagUnknown = ''
let tagCounted = ''

watch(
    allRoutes,
    (routes) => {
        routeInfoById = new Map(
            routes.map((route) => [
                route.id,
                {
                    name: route.name || route.id,
                    location: route.location ?? null,
                    locationName: locationName(route),
                },
            ]),
        )
    },
    { immediate: true },
)
watch(
    scannedRouteIds,
    (ids) => {
        scannedIdSet = new Set(ids)
    },
    {
        immediate: true,
    },
)
watch(
    sessionLocation,
    (value) => {
        activeLocation = value
    },
    {
        immediate: true,
    },
)
watch(
    locale,
    () => {
        tagUnknown = t('inventory.tagUnknown')
        tagCounted = t('inventory.tagCounted')
    },
    { immediate: true },
)

const codeTag = (rawValue: string) => {
    const id = extractRouteId(rawValue)
    const info = id ? routeInfoById.get(id) : undefined

    if (!id || !info) return { color: '#EF4444', label: tagUnknown }
    if (info.location !== activeLocation) {
        return {
            color: '#EF4444',
            label: `${info.name} · ${info.locationName || '—'}`,
        }
    }
    if (scannedIdSet.has(id)) {
        return { color: '#0EA5E9', label: `${tagCounted} · ${info.name}` }
    }
    return { color: '#1D9E75', label: info.name }
}

const onDetect = (detectedCodes: { rawValue: string }[]) => {
    if (!Array.isArray(detectedCodes) || !acceptingScans.value) return
    for (const code of detectedCodes) {
        if (code.rawValue) void handleScanResult(code.rawValue)
    }
}

const startScanner = () => {
    if (sessionLocation.value) startCamera()
}

const recentScans = new Map<string, number>()

const addScannedRoute = async (id: string) => {
    const route = allRoutes.value.find((entry) => entry.id === id)

    if (!route) {
        signalRejected()
        return
    }

    if (route.location !== sessionLocation.value) {
        signalRejected()
        return
    }

    if (scannedRouteIds.value.includes(id)) {
        signalDuplicate()
        return
    }

    if (route.archived) {
        try {
            await pb.collection('routes').update(id, { archived: false })
            allRoutes.value = allRoutes.value.map((entry) =>
                entry.id === id ? { ...entry, archived: false } : entry,
            )
            notifySuccess(
                t('inventory.restoreSuccess', { name: route.name || route.id }),
            )
        } catch (error) {
            console.error('Failed to restore archived route:', error)
            signalRejected()
            notifyError(t('inventory.restoreError'))
            return
        }
    }

    scannedRouteIds.value = [...scannedRouteIds.value, id]
    signalAccepted()
}

const handleScanResult = async (text: string) => {
    const id = extractRouteId(text)

    const key = id ?? `raw:${text}`
    const now = Date.now()
    if (now - (recentScans.get(key) ?? 0) < SCAN_COOLDOWN_MS) return
    recentScans.set(key, now)

    if (!id) {
        signalRejected()
        return
    }

    await addScannedRoute(id)
}

const markFound = (
    route: RouteRecord,
    options: { closeManual?: boolean } = {},
) => {
    if (!scannedRouteIds.value.includes(route.id)) {
        scannedRouteIds.value = [...scannedRouteIds.value, route.id]
        notifySuccess(
            t('inventory.markedFound', { name: route.name || route.id }),
        )
    }
    if (options.closeManual) manualDialog.value = false
}

const undoScan = (route: RouteRecord) => {
    scannedRouteIds.value = scannedRouteIds.value.filter(
        (id) => id !== route.id,
    )
    recentScans.delete(route.id)
    notifySuccess(t('inventory.undone', { name: route.name || route.id }))
}

const loadRoutes = async () => {
    loadingRoutes.value = true
    try {
        allRoutes.value = await pb
            .collection('routes')
            .getFullList<RouteRecord>({
                fields: ROUTE_FIELDS,
                expand: 'location',
                $autoCancel: false,
            })
        reconcileScannedIds()
    } catch (error) {
        const message = (error as { message?: string })?.message
        if (message?.includes('autocancelled')) return
        console.error('Failed to load routes for inventory:', error)
        scannerError.value = t('inventory.loadError')
    } finally {
        loadingRoutes.value = false
    }
}

const openManualDialog = () => {
    manualSearch.value = ''
    manualDialog.value = true
}

const openFinishDialog = () => {
    archiveSelection.value = new Set(missing.value.map((route) => route.id))
    finishDialog.value = true
}

const toggleArchive = (id: string, selected: unknown) => {
    const next = new Set(archiveSelection.value)
    if (selected) next.add(id)
    else next.delete(id)
    archiveSelection.value = next
}

const resetInventory = () => {
    stopScanner()
    recentScans.clear()
    finishDialog.value = false
    archiveSelection.value = new Set()
    scannedRouteIds.value = []
    restoredUnscoped.value = false
    try {
        clearSession()
    } catch (error) {
        console.warn('Failed to clear inventory session:', error)
    }
}

const confirmReset = () => {
    resetInventory()
    resetDialog.value = false
}

const confirmFinish = async () => {
    const ids = archiveIds.value

    if (ids.length === 0) {
        resetInventory()
        notifySuccess(t('inventory.nothingToArchive'))
        await loadRoutes()
        return
    }

    archiving.value = true
    try {
        const batch = pb.createBatch()
        ids.forEach((id) => {
            batch.collection('routes').update(id, { archived: true })
        })
        await batch.send()
        resetInventory()
        notifySuccess(
            t('inventory.archiveSuccess', { count: ids.length }, ids.length),
        )
        await loadRoutes()
    } catch (error) {
        console.error('Failed to archive routes:', error)
        notifyError(t('inventory.archiveError'))
    } finally {
        archiving.value = false
    }
}

const { data: initial } = await useAsyncData('inventory-routes', async () => {
    await loadRoutes()
    return allRoutes.value
})

if (initial.value) {
    allRoutes.value = initial.value
}

onMounted(() => {
    restoreSession()
    reconcileScannedIds()
    if (!hasSeenInstructions()) instructionsDialog.value = true
})

watch(instructionsDialog, (open) => {
    if (!open) markInstructionsSeen()
})
</script>

<style scoped>
.inventory-page {
    max-width: 600px;
    margin: 0 auto;
    padding-bottom: env(safe-area-inset-bottom, 0);
}

.inventory-title {
    margin: 0;
    min-width: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.5;
}

.progress-group {
    flex: 1 1 140px;
    min-width: 140px;
}

.scanner-viewport {
    position: relative;
    width: 100%;
    height: 40vh;
    min-height: 200px;
    background: #111;
    overflow: hidden;
}

.scanner-viewport__torch {
    position: absolute;
    bottom: 12px;
    right: 12px;
}

.instructions-list {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.review-list {
    max-height: 200px;
    overflow-y: auto;
}

@media (min-width: 600px) {
    .scanner-viewport {
        height: 320px;
    }
}

@media (min-width: 740px) {
    .inventory-page {
        max-width: none;
        padding: 16px 0 24px;
    }

    .inventory-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        column-gap: 24px;
        align-items: start;
    }

    .inventory-layout__controls {
        grid-column: 1 / -1;
        margin-bottom: 16px;
    }

    .inventory-layout__lists,
    .inventory-columns {
        display: contents;
    }

    .inventory-column {
        padding-inline: 16px;
    }

    .inventory-column :deep(.scope-list) {
        max-height: calc(100vh - 360px);
    }

    .inventory-column--missing {
        grid-column: 1;
        grid-row: 2;
    }

    .inventory-column--found {
        grid-column: 2;
        grid-row: 2;
    }

    .inventory-title {
        font-size: 1.125rem;
        white-space: normal;
    }

    .scanner-viewport {
        height: 45vh;
        border-radius: 12px;
    }
}

@media (min-width: 1545px) {
    .inventory-layout {
        grid-template-columns: minmax(0, 1fr) minmax(440px, 1.4fr) minmax(
                0,
                1fr
            );
    }

    .inventory-layout__controls {
        grid-column: 2;
        grid-row: 1;
        margin-bottom: 0;
    }

    .inventory-column--missing {
        grid-row: 1;
    }

    .inventory-column--found {
        grid-column: 3;
        grid-row: 1;
    }

    .progress-group {
        flex-basis: 100%;
    }

    .inventory-column :deep(.scope-list) {
        max-height: calc(100vh - 220px);
    }

    .scanner-viewport {
        height: auto;
        aspect-ratio: 4 / 3;
        max-height: calc(100vh - 300px);
    }
}
</style>
