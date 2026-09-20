<template>
    <v-container class="inventory-page pa-0">
        <!-- ── Desktop: not supported ─────────────────────────────────── -->
        <div v-if="!isMobile" class="pa-4">
            <LayoutPageHeader :title="$t('inventory.title')" />
            <LayoutEmptyState
                icon="mdi-cellphone"
                :title="$t('inventory.mobileOnly')"
            />
        </div>

        <!-- ── Mobile scanner UI ──────────────────────────────────────── -->
        <template v-if="isMobile">
            <!-- The viewport only exists while the camera does; an idle black
                 box would eat a third of the screen for nothing. -->
            <div v-if="cameraActive" ref="viewportRef" class="scanner-viewport">
                <QrcodeStream
                    :formats="['qr_code']"
                    :constraints="cameraConstraints"
                    :track="trackQrCode"
                    @detect="onDetect"
                    @camera-on="onCameraOn"
                    @error="onCameraError"
                />
                <v-btn
                    v-if="scanning && torchSupported"
                    class="scanner-viewport__torch"
                    :icon="torchOn ? 'mdi-flashlight' : 'mdi-flashlight-off'"
                    :color="torchOn ? 'warning' : undefined"
                    variant="flat"
                    size="small"
                    :aria-label="$t('inventory.toggleTorch')"
                    data-testid="inventory-torch"
                    @click="toggleTorch"
                />
            </div>

            <!-- ── Summary: scope, progress and utilities in two rows ──── -->
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
                        :disabled="scannedRouteIds.length === 0 && !scanning"
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

                <!-- Scope and progress share a row, wrapping only when the
                     segmented picker and the bar cannot both fit. -->
                <div class="d-flex flex-wrap align-center ga-3">
                    <!-- Two sites, so segmented buttons beat a dropdown:
                         one tap, and the active scope is readable at a glance. -->
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
                            :data-testid="`inventory-location-${item.value}`"
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
                        :close-label="$t('inventory.changeLocation')"
                        data-testid="inventory-change-location"
                        @click:close="resetDialog = true"
                    >
                        {{ sessionLocation }}
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

            <!-- Camera/permission failure is a state, not an event, so it
                 stays inline next to the retry button. -->
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

            <!-- ── Primary actions ──────────────────────────────────────── -->
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
                {{ $t('inventory.unlocatedNote', { count: unlocatedCount }) }}
            </div>

            <!-- ── Missing / found, as tabs rather than stacked sections ── -->
            <v-tabs
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

            <v-tabs-window v-model="activeTab" class="px-4 pt-3 pb-6">
                <v-tabs-window-item value="missing">
                    <v-list
                        v-if="missing.length"
                        density="compact"
                        class="scope-list rounded-lg"
                        border
                    >
                        <v-list-item
                            v-for="route in missing"
                            :key="route.id"
                            :data-testid="`inventory-missing-${route.id}`"
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
                                <span
                                    class="text-body-small text-medium-emphasis mr-2"
                                >
                                    {{ formatDifficulty(route) }}
                                </span>
                                <v-btn
                                    icon="mdi-check"
                                    variant="text"
                                    size="small"
                                    :aria-label="$t('inventory.markFound')"
                                    :data-testid="`inventory-mark-${route.id}`"
                                    @click="markFound(route)"
                                />
                            </template>
                        </v-list-item>
                    </v-list>

                    <LayoutEmptyState
                        v-else
                        :card="false"
                        icon="mdi-check-all"
                        :title="
                            sessionLocation
                                ? $t('inventory.allFound')
                                : $t('inventory.locationRequired')
                        "
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
                    <v-list
                        v-if="foundRoutes.length"
                        density="compact"
                        class="scope-list rounded-lg"
                        border
                    >
                        <v-list-item
                            v-for="route in foundRoutes"
                            :key="route.id"
                            :data-testid="`inventory-scanned-${route.id}`"
                        >
                            <template #prepend>
                                <v-icon size="16" color="success" class="mr-3"
                                    >mdi-check-circle-outline</v-icon
                                >
                            </template>
                            <v-list-item-title class="text-body-medium">
                                {{ route.name }}
                            </v-list-item-title>
                            <template #append>
                                <span
                                    class="text-body-small text-medium-emphasis mr-2"
                                >
                                    {{ formatDifficulty(route) }}
                                </span>
                                <v-btn
                                    icon="mdi-undo"
                                    variant="text"
                                    size="small"
                                    :aria-label="$t('inventory.undo')"
                                    :data-testid="`inventory-undo-${route.id}`"
                                    @click="undoScan(route)"
                                />
                            </template>
                        </v-list-item>
                    </v-list>

                    <LayoutEmptyState
                        v-else
                        :card="false"
                        icon="mdi-qrcode-scan"
                        :title="$t('inventory.noScans')"
                    />
                </v-tabs-window-item>
            </v-tabs-window>
        </template>

        <!-- ── Instructions dialog ────────────────────────────────────── -->
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

        <!-- ── Manual add dialog ──────────────────────────────────────── -->
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

        <!-- ── Finish review dialog ───────────────────────────────────── -->
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

        <!-- ── Reset confirmation ─────────────────────────────────────── -->
        <ConfirmDialog
            v-model="resetDialog"
            :title="$t('inventory.resetTitle')"
            :message="
                $t('inventory.resetMessage', { count: scannedRouteIds.length })
            "
            :confirm-text="$t('inventory.reset')"
            @confirm="confirmReset"
        />
    </v-container>
</template>

<script setup lang="ts">
import { QrcodeStream } from 'vue-qrcode-reader'
import { formatAnchorPoint, formatDifficulty } from '~/utils/formatting'
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
    authRequired: true,
    requiredPermission: 'run_inventory',
})

const ROUTE_FIELDS =
    'id,name,location,difficulty,difficulty_sign,anchor_point,archived'
const SCAN_COOLDOWN_MS = 2000

const { t, locale } = useI18n()
const pb = usePocketbase()
const { smAndDown } = useDisplay()
const { locations } = useRouteFilters()
const {
    success: notifySuccess,
    error: notifyError,
    warning: notifyWarning,
} = useNotification()

const isMobile = computed(() => smAndDown.value)

const allRoutes = ref<RouteRecord[]>([])
const loadingRoutes = ref(false)
const scannedRouteIds = ref<string[]>([])
const sessionLocation = ref<string | null>(null)
const restoredUnscoped = ref(false)

const scanning = ref(false)
const cameraActive = ref(false)
const torchOn = ref(false)
const torchSupported = ref(false)
const scannerError = ref('')

const instructionsDialog = ref(false)
const manualDialog = ref(false)
const manualSearch = ref('')
const finishDialog = ref(false)
const resetDialog = ref(false)
const activeTab = ref<'missing' | 'found'>('missing')
const archiving = ref(false)
const archiveSelection = ref(new Set<string>())

// Higher than the browser default: route labels are small and often scanned
// from a step back, where the default stream resolution loses the modules.
const cameraConstraints = {
    facingMode: 'environment',
    width: { ideal: 1920 },
    height: { ideal: 1080 },
}

const locationItems = computed(() =>
    locations.value
        .filter((entry) => entry.value)
        .map((entry) => ({ title: entry.text, value: entry.value })),
)

// A started inventory is pinned to its location; changing it means resetting,
// so the archive step can never span two sites.
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

/**
 * Drops stored ids that no longer belong in this session: deleted routes go
 * quietly, routes at another location are reported because the user needs to
 * know their earlier scans are not being counted here.
 */
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
            t('inventory.droppedForLocation', { count: wrongLocation }),
        )
    }
    if (kept.length !== scannedRouteIds.value.length) {
        scannedRouteIds.value = kept
    }
    if (sessionLocation.value) restoredUnscoped.value = false
}

watch(sessionLocation, () => reconcileScannedIds())

// ── Scan feedback ───────────────────────────────────────────────────────
// Sound and vibration let you keep walking instead of watching the screen.
let audioContext: AudioContext | null = null

const ensureAudio = () => {
    if (!import.meta.client) return
    try {
        audioContext ||= new (
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext
        )()
        if (audioContext.state === 'suspended') void audioContext.resume()
    } catch {
        audioContext = null
    }
}

const beep = (frequency: number, duration = 0.12) => {
    if (!audioContext) return
    try {
        const now = audioContext.currentTime
        const oscillator = audioContext.createOscillator()
        const gain = audioContext.createGain()
        oscillator.type = 'sine'
        oscillator.frequency.value = frequency
        gain.gain.setValueAtTime(0.0001, now)
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
        oscillator.connect(gain)
        gain.connect(audioContext.destination)
        oscillator.start(now)
        oscillator.stop(now + duration)
    } catch {
        // Audio is a nicety; never let it break a scan.
    }
}

const vibrate = (pattern: number | number[]) => {
    // Absent on iOS Safari.
    try {
        navigator.vibrate?.(pattern)
    } catch {
        // ignore
    }
}

const signalAccepted = () => {
    vibrate(60)
    beep(880)
}

const signalDuplicate = () => {
    vibrate(30)
    beep(520)
}

const signalRejected = () => {
    vibrate([40, 60, 40])
    beep(220, 0.2)
}

// ── Camera ──────────────────────────────────────────────────────────────
// Never hand the stream a pause. The library implements it by stopping the
// track and re-running getUserMedia to resume, so a freeze on every scan cost
// a full camera re-initialisation -- seconds on iOS, with the viewport showing
// its backdrop until the first frame arrived. Detections are ignored while a
// dialog is open instead, which is all the pause was really protecting.
const acceptingScans = computed(
    () => !finishDialog.value && !manualDialog.value,
)

// The track callback runs several times a second; vue-qrcode-reader's docs
// warn against touching reactive state from it, so everything it reads is a
// plain snapshot kept up to date by these watchers.
let routeInfoById = new Map<string, { name: string; location: string | null }>()
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

/**
 * What to paint on a detected code. This is the only feedback a scan needs:
 * it lands on the code you are pointing at, instead of a banner covering the
 * viewfinder to repeat what the overlay already says.
 */
const codeTag = (rawValue: string) => {
    const id = extractRouteId(rawValue)
    const info = id ? routeInfoById.get(id) : undefined

    if (!id || !info) return { color: '#EF4444', label: tagUnknown }
    if (info.location !== activeLocation) {
        return {
            color: '#EF4444',
            label: `${info.name} · ${info.location || '—'}`,
        }
    }
    if (scannedIdSet.has(id)) {
        return { color: '#0EA5E9', label: `${tagCounted} · ${info.name}` }
    }
    return { color: '#1D9E75', label: info.name }
}

const trackQrCode = (
    detectedCodes: { boundingBox?: DOMRectReadOnly; rawValue: string }[],
    ctx: CanvasRenderingContext2D,
) => {
    for (const code of detectedCodes) {
        const { boundingBox } = code
        if (!boundingBox) continue
        const { color, label } = codeTag(code.rawValue)

        ctx.lineWidth = 3
        ctx.strokeStyle = color
        ctx.strokeRect(
            boundingBox.x,
            boundingBox.y,
            boundingBox.width,
            boundingBox.height,
        )

        const fontSize = Math.max(16, boundingBox.width * 0.1)
        ctx.font = `600 ${fontSize}px sans-serif`
        const textWidth = ctx.measureText(label).width
        const padding = 6
        // Keep the tag inside the frame. A code near an edge would otherwise
        // centre its label half off-screen, and one near the bottom would
        // write it below the viewport.
        const labelX = Math.min(
            Math.max(
                boundingBox.x + (boundingBox.width - textWidth) / 2,
                padding,
            ),
            Math.max(padding, ctx.canvas.width - textWidth - padding),
        )
        const below = boundingBox.y + boundingBox.height + fontSize + padding
        const labelY =
            below + padding / 2 > ctx.canvas.height
                ? boundingBox.y - padding
                : below

        ctx.fillStyle = color
        ctx.fillRect(
            labelX - padding,
            labelY - fontSize,
            textWidth + padding * 2,
            fontSize + padding,
        )
        ctx.fillStyle = '#fff'
        ctx.fillText(label, labelX, labelY - padding / 2)
    }
}

const onDetect = (detectedCodes: { rawValue: string }[]) => {
    if (!Array.isArray(detectedCodes) || !acceptingScans.value) return
    for (const code of detectedCodes) {
        if (code.rawValue) void handleScanResult(code.rawValue)
    }
}

const viewportRef = useTemplateRef<HTMLElement>('viewportRef')

/** The live camera track, reached through the element the library owns. */
const videoTrack = (): MediaStreamTrack | null => {
    const stream = viewportRef.value?.querySelector('video')
        ?.srcObject as MediaStream | null
    return stream?.getVideoTracks()[0] ?? null
}

// Not the component's `torch` prop: that sits in the same watched object as
// the stream constraints, so flipping it tears the camera down and runs
// getUserMedia again -- a visible re-initialisation for what the spec applies
// to a running track.
const toggleTorch = async () => {
    const track = videoTrack()
    if (!track) return
    const next = !torchOn.value
    try {
        await track.applyConstraints({
            advanced: [{ torch: next } as unknown as MediaTrackConstraintSet],
        })
        torchOn.value = next
    } catch (error) {
        console.error('Failed to toggle the torch:', error)
        torchSupported.value = false
    }
}

const onCameraOn = (capabilities: Partial<MediaTrackCapabilities>) => {
    scanning.value = true
    scannerError.value = ''
    torchSupported.value = !!capabilities && 'torch' in capabilities
}

const onCameraError = (error: { name?: string; message?: string }) => {
    console.error('Camera error:', error)
    scanning.value = false
    cameraActive.value = false
    torchSupported.value = false
    torchOn.value = false
    scannerError.value =
        error?.name === 'NotAllowedError' || error?.name === 'NotFoundError'
            ? t('inventory.cameraError')
            : error?.message || t('inventory.cameraError')
}

const startScanner = () => {
    if (!import.meta.client || !isMobile.value || !sessionLocation.value) return
    // This tap is the user gesture the AudioContext needs.
    ensureAudio()
    scannerError.value = ''
    cameraActive.value = true
}

const stopScanner = () => {
    cameraActive.value = false
    scanning.value = false
    torchOn.value = false
    torchSupported.value = false
}

// ── Scanning ────────────────────────────────────────────────────────────
const recentScans = new Map<string, number>()

const addScannedRoute = async (id: string) => {
    const route = allRoutes.value.find((entry) => entry.id === id)

    // Unknown, wrong-site and already-counted codes are all labelled on the
    // code itself by the track overlay, so they only need a sound here.
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

    // A sign that is still on the wall means the route is active again.
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

    // Cooldown keyed on the payload, so a code simply held in frame is not
    // re-processed — and an unreadable one does not buzz on every frame.
    const key = id ?? `raw:${text}`
    const now = Date.now()
    if (now - (recentScans.get(key) ?? 0) < SCAN_COOLDOWN_MS) return
    recentScans.set(key, now)

    if (!id) {
        // The track overlay already outlines it in red and names it.
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

// ── Routes ──────────────────────────────────────────────────────────────
const loadRoutes = async () => {
    loadingRoutes.value = true
    try {
        allRoutes.value = await pb
            .collection('routes')
            .getFullList<RouteRecord>({
                fields: ROUTE_FIELDS,
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

// ── Dialogs ─────────────────────────────────────────────────────────────
const openManualDialog = () => {
    manualSearch.value = ''
    manualDialog.value = true
}

const openFinishDialog = () => {
    // Everything is staged for archiving by default; unchecking opts a route
    // out, for a label that could not be reached rather than one that is gone.
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
        notifySuccess(t('inventory.archiveSuccess', { count: ids.length }))
        await loadRoutes()
    } catch (error) {
        console.error('Failed to archive routes:', error)
        notifyError(t('inventory.archiveError'))
    } finally {
        archiving.value = false
    }
}

// ── Lifecycle ───────────────────────────────────────────────────────────
watch(isMobile, (value) => {
    if (!value) stopScanner()
})

// iOS ends the capture track when the tab is backgrounded or the screen
// locks, and an ended track cannot be revived -- only a fresh getUserMedia
// helps. We cannot call that on returning either: the gesture that authorised
// the camera has long expired, so it would be rejected rather than re-prompt.
// So tear the dead stream down and let the normal Start button come back; its
// tap is the gesture that gets the camera again.
const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden' && cameraActive.value)
        stopScanner()
}

onMounted(async () => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    restoreSession()
    // Shown once, then on demand from the info button — it used to reopen on
    // every visit and swallow the first tap.
    if (isMobile.value && !hasSeenInstructions())
        instructionsDialog.value = true
    await loadRoutes()
})

watch(instructionsDialog, (open) => {
    if (!open) markInstructionsSeen()
})

onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    stopScanner()
    void audioContext?.close()
    audioContext = null
})
</script>

<style scoped>
.inventory-page {
    max-width: 600px;
    margin: 0 auto;
    padding-bottom: env(safe-area-inset-bottom, 0);
}

/* The heading rides in the utility row rather than in a LayoutPageHeader
   block: this page is a tool, and a title band would cost a tenth of the
   screen the route checklist needs. Still the page's only h1. */
.inventory-title {
    margin: 0;
    min-width: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.5;
}

/* Wraps below the location picker only when both cannot fit. */
.progress-group {
    flex: 1 1 140px;
    min-width: 140px;
}

/* ── Scanner viewport ────────────────────────────────────────────────── */
/* Only mounted while the camera runs, so it can afford to be generous
   without costing anything when idle. */
.scanner-viewport {
    position: relative;
    width: 100%;
    /* Definite, not a cap: the scanner's wrapper and the tracking canvas it
       overlays are both height:100%, which is indefinite against an auto-height
       parent. Safari then sized the canvas bitmap (taken from the video box)
       and the canvas CSS box differently, and every tracking box and label was
       drawn stretched and offset. Sized so the stream never pushes the
       checklist off screen. */
    height: 40vh;
    min-height: 200px;
    background: #111;
    overflow: hidden;
}

/* Explicit, not inherited from the library's inline style: a video element
   defaults to object-fit: contain, so a portrait camera stream in this
   landscape box gets pillarboxed with the backdrop showing either side. The
   tracking layer is deliberately excluded -- its bitmap already matches its
   box, and fitting it would move the overlay off the picture. */
.scanner-viewport :deep(video),
.scanner-viewport :deep(#qrcode-stream-pause-frame) {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.scanner-viewport__torch {
    position: absolute;
    top: 12px;
    right: 12px;
}

/* ── Instructions list ───────────────────────────────────────────────── */
.instructions-list {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

/* ── Route lists ─────────────────────────────────────────────────────── */
/* Viewport-relative so tall phones show more rows instead of padding. */
.scope-list {
    max-height: 46vh;
    overflow-y: auto;
}

.review-list {
    max-height: 200px;
    overflow-y: auto;
}

/* Anchor point doubles as the walking order, so it leads each row. */
.anchor-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 26px;
    margin-right: 12px;
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

/* One line per route: the list is the page, so rows stay tight. */
.scope-list :deep(.v-list-item) {
    min-height: 40px;
}
</style>
