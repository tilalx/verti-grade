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
            <LayoutPageHeader
                :title="$t('inventory.title')"
                class="px-4 pt-4"
            />

            <!-- Scanner viewport -->
            <div class="scanner-viewport">
                <QrcodeStream
                    v-if="cameraActive"
                    :formats="['qr_code']"
                    :constraints="cameraConstraints"
                    :torch="torchOn"
                    :paused="streamPaused"
                    :track="trackQrCode"
                    @detect="onDetect"
                    @camera-on="onCameraOn"
                    @error="onCameraError"
                />
                <!-- Overlay when not scanning -->
                <div v-if="!scanning" class="scanner-viewport__placeholder">
                    <v-icon
                        size="48"
                        color="white"
                        class="mb-2"
                        style="opacity: 0.6"
                        >mdi-qrcode-scan</v-icon
                    >
                    <span
                        class="text-body-medium text-center px-6"
                        style="color: rgba(255, 255, 255, 0.6)"
                    >
                        {{ $t('inventory.subtitle') }}
                    </span>
                </div>
                <!-- Torch, only where the device reports the capability -->
                <v-btn
                    v-if="scanning && torchSupported"
                    class="scanner-viewport__torch"
                    :icon="torchOn ? 'mdi-flashlight' : 'mdi-flashlight-off'"
                    :color="torchOn ? 'warning' : undefined"
                    variant="flat"
                    size="small"
                    :aria-label="$t('inventory.toggleTorch')"
                    data-testid="inventory-torch"
                    @click="torchOn = !torchOn"
                />
            </div>

            <!-- Status bar -->
            <div class="status-bar px-4 py-3">
                <div class="d-flex align-center justify-space-between mb-2">
                    <div class="d-flex ga-3">
                        <v-chip
                            size="small"
                            variant="tonal"
                            color="success"
                            prepend-icon="mdi-check-circle-outline"
                            data-testid="inventory-found-count"
                        >
                            {{ foundRoutes.length }}
                        </v-chip>
                        <v-chip
                            size="small"
                            variant="tonal"
                            color="warning"
                            prepend-icon="mdi-help-circle-outline"
                            data-testid="inventory-missing-count"
                        >
                            {{ missing.length }}
                        </v-chip>
                    </div>
                    <v-btn
                        icon="mdi-information-outline"
                        variant="text"
                        size="small"
                        :aria-label="$t('inventory.showInstructions')"
                        @click="instructionsDialog = true"
                    />
                </div>
                <v-progress-linear
                    :model-value="progress"
                    color="success"
                    height="6"
                    rounded
                />
                <div
                    class="text-body-small text-medium-emphasis mt-1"
                    data-testid="inventory-progress"
                >
                    {{
                        $t('inventory.progress', {
                            found: foundRoutes.length,
                            total: scoped.length,
                        })
                    }}
                </div>
            </div>

            <!-- Location scope: what gets counted, and what gets archived -->
            <div class="px-4 pt-3">
                <v-select
                    v-model="sessionLocation"
                    :items="locationItems"
                    :label="$t('inventory.locationLabel')"
                    :hint="locationHint"
                    persistent-hint
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    :disabled="locationLocked"
                    data-testid="inventory-location"
                />
                <div v-if="locationLocked" class="d-flex justify-end">
                    <v-btn
                        variant="text"
                        size="small"
                        data-testid="inventory-change-location"
                        @click="resetDialog = true"
                    >
                        {{ $t('inventory.changeLocation') }}
                    </v-btn>
                </div>
            </div>

            <!-- Camera/permission failure is a state, not an event, so it
                 stays inline next to the retry button. -->
            <div v-if="scannerError" class="px-4 pt-3">
                <v-alert
                    type="error"
                    closable
                    data-testid="inventory-scanner-error"
                    @click:close="scannerError = ''"
                >
                    {{ scannerError }}
                </v-alert>
            </div>

            <!-- Action buttons -->
            <div class="d-flex ga-2 px-4 pt-3">
                <v-btn
                    v-if="!scanning"
                    color="primary"
                    size="large"
                    class="flex-grow-1"
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
                    size="large"
                    class="flex-grow-1"
                    prepend-icon="mdi-stop-circle"
                    data-testid="inventory-stop"
                    @click="stopScanner()"
                >
                    {{ $t('inventory.stop') }}
                </v-btn>
                <v-btn
                    variant="tonal"
                    color="error"
                    size="large"
                    min-width="0"
                    :disabled="scannedRouteIds.length === 0 && !scanning"
                    :aria-label="$t('inventory.reset')"
                    data-testid="inventory-reset"
                    @click="resetDialog = true"
                >
                    <v-icon>mdi-refresh</v-icon>
                </v-btn>
            </div>

            <!-- Active routes with no location sit outside every scoped
                 inventory, so say so rather than letting them go unnoticed. -->
            <div
                v-if="unlocatedCount > 0"
                class="px-4 pt-3 text-body-small text-medium-emphasis"
                data-testid="inventory-unlocated-note"
            >
                {{ $t('inventory.unlocatedNote', { count: unlocatedCount }) }}
            </div>

            <!-- Still to find -->
            <div class="px-4 pt-4">
                <div class="d-flex align-center justify-space-between mb-2">
                    <span
                        class="text-title-small font-weight-semibold text-medium-emphasis"
                    >
                        {{ $t('inventory.stillToFind') }}
                    </span>
                    <v-btn
                        variant="tonal"
                        size="small"
                        prepend-icon="mdi-plus"
                        :disabled="missing.length === 0"
                        data-testid="inventory-manual-open"
                        @click="openManualDialog()"
                    >
                        {{ $t('inventory.addManually') }}
                    </v-btn>
                </div>

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
                        <v-list-item-subtitle class="text-body-small">
                            {{ formatDifficulty(route) || '—' }}
                        </v-list-item-subtitle>
                        <template #append>
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
            </div>

            <!-- Found -->
            <div class="px-4 pt-4 pb-2">
                <div class="d-flex align-center justify-space-between mb-2">
                    <span
                        class="text-title-small font-weight-semibold text-medium-emphasis"
                    >
                        {{ $t('inventory.reviewFoundTitle') }}
                    </span>
                    <v-btn
                        variant="text"
                        size="small"
                        :append-icon="
                            foundExpanded
                                ? 'mdi-chevron-up'
                                : 'mdi-chevron-down'
                        "
                        :disabled="foundRoutes.length === 0"
                        data-testid="inventory-found-toggle"
                        @click="foundExpanded = !foundExpanded"
                    >
                        {{ foundRoutes.length }}
                    </v-btn>
                </div>

                <v-list
                    v-if="foundRoutes.length && foundExpanded"
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
                            <v-icon size="16" color="success" class="mr-2"
                                >mdi-check-circle-outline</v-icon
                            >
                        </template>
                        <v-list-item-title class="text-body-medium">
                            {{ route.name }}
                        </v-list-item-title>
                        <v-list-item-subtitle class="text-body-small">
                            {{ formatDifficulty(route) || '—' }}
                        </v-list-item-subtitle>
                        <template #append>
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

                <div
                    v-else-if="!foundRoutes.length"
                    class="text-body-medium text-medium-emphasis"
                >
                    {{ $t('inventory.noScans') }}
                </div>
            </div>

            <!-- Finish button -->
            <div v-if="scannedRouteIds.length > 0" class="px-4 pb-6 pt-2">
                <v-btn
                    color="primary"
                    block
                    size="large"
                    :disabled="loadingRoutes || !sessionLocation"
                    :loading="loadingRoutes"
                    prepend-icon="mdi-check"
                    data-testid="inventory-finish-open"
                    @click="openFinishDialog()"
                >
                    {{ $t('inventory.finish') }}
                </v-btn>
            </div>
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
                    <v-list-item-subtitle class="text-body-small">
                        {{ formatDifficulty(route) || '—' }}
                    </v-list-item-subtitle>
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
            <!-- Found routes -->
            <div class="mb-4">
                <div class="text-title-small font-weight-semibold mb-2">
                    {{ $t('inventory.reviewFoundTitle') }}
                    <v-chip
                        size="x-small"
                        variant="tonal"
                        color="success"
                        class="ml-1"
                    >
                        {{ foundRoutes.length }}
                    </v-chip>
                </div>
                <v-list density="compact" class="review-list rounded-lg" border>
                    <v-list-item
                        v-for="route in foundRoutes"
                        :key="`found-${route.id}`"
                    >
                        <v-list-item-title class="text-body-medium">
                            {{ route.name || route.id }}
                        </v-list-item-title>
                        <template #prepend>
                            <v-icon size="16" color="success"
                                >mdi-check-circle-outline</v-icon
                            >
                        </template>
                    </v-list-item>
                    <v-list-item v-if="foundRoutes.length === 0">
                        <v-list-item-title
                            class="text-body-medium text-medium-emphasis"
                        >
                            {{ $t('inventory.noScans') }}
                        </v-list-item-title>
                    </v-list-item>
                </v-list>
            </div>

            <!-- Missing routes — each one opts out of archiving on its own -->
            <div>
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
                        <v-list-item-subtitle class="text-body-small">
                            {{ formatDifficulty(route) || '—' }}
                        </v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="missing.length === 0">
                        <v-list-item-title
                            class="text-body-medium text-medium-emphasis"
                        >
                            {{ $t('inventory.nothingToArchive') }}
                        </v-list-item-title>
                    </v-list-item>
                </v-list>
            </div>
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
const FREEZE_MS = 400

const { t } = useI18n()
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
const paused = ref(false)
const torchOn = ref(false)
const torchSupported = ref(false)
const scannerError = ref('')

const instructionsDialog = ref(false)
const manualDialog = ref(false)
const manualSearch = ref('')
const finishDialog = ref(false)
const resetDialog = ref(false)
const foundExpanded = ref(false)
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
let freezeTimer: ReturnType<typeof setTimeout> | null = null

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

const freezeFrame = () => {
    if (!cameraActive.value) return
    paused.value = true
    if (freezeTimer) clearTimeout(freezeTimer)
    freezeTimer = setTimeout(() => {
        paused.value = false
        freezeTimer = null
    }, FREEZE_MS)
}

const signalAccepted = () => {
    vibrate(60)
    beep(880)
    freezeFrame()
}

const signalDuplicate = () => {
    vibrate(30)
    beep(520)
    freezeFrame()
}

const signalRejected = () => {
    vibrate([40, 60, 40])
    beep(220, 0.2)
}

// ── Camera ──────────────────────────────────────────────────────────────
// Dialogs pause the stream rather than unmounting it, so cancelling out of
// the review does not pay for a full camera re-initialisation.
const streamPaused = computed(
    () => paused.value || finishDialog.value || manualDialog.value,
)

// The track callback runs several times a second; vue-qrcode-reader's docs
// warn against touching reactive state from it, so read a plain snapshot.
let scopedNamesById = new Map<string, string>()
watch(
    scoped,
    (routes) => {
        scopedNamesById = new Map(
            routes.map((route) => [route.id, route.name || route.id]),
        )
    },
    { immediate: true },
)

const trackQrCode = (
    detectedCodes: { boundingBox?: DOMRectReadOnly; rawValue: string }[],
    ctx: CanvasRenderingContext2D,
) => {
    for (const code of detectedCodes) {
        const { boundingBox } = code
        if (!boundingBox) continue
        const id = extractRouteId(code.rawValue)
        const name = id ? scopedNamesById.get(id) : undefined
        const color = name ? '#1D9E75' : '#EF4444'

        ctx.lineWidth = 3
        ctx.strokeStyle = color
        ctx.strokeRect(
            boundingBox.x,
            boundingBox.y,
            boundingBox.width,
            boundingBox.height,
        )

        const label = name ?? t('inventory.invalidCode')
        const fontSize = Math.max(14, boundingBox.width * 0.1)
        ctx.font = `600 ${fontSize}px sans-serif`
        const textWidth = ctx.measureText(label).width
        const padding = 6
        const labelX = boundingBox.x + (boundingBox.width - textWidth) / 2
        const labelY = boundingBox.y + boundingBox.height + fontSize + padding

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
    if (!Array.isArray(detectedCodes)) return
    for (const code of detectedCodes) {
        if (code.rawValue) void handleScanResult(code.rawValue)
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
    paused.value = false
    cameraActive.value = true
}

const stopScanner = () => {
    cameraActive.value = false
    scanning.value = false
    paused.value = false
    torchOn.value = false
    torchSupported.value = false
    if (freezeTimer) {
        clearTimeout(freezeTimer)
        freezeTimer = null
    }
}

// ── Scanning ────────────────────────────────────────────────────────────
const recentScans = new Map<string, number>()

const addScannedRoute = async (id: string) => {
    const route = allRoutes.value.find((entry) => entry.id === id)

    if (!route) {
        signalRejected()
        notifyError(t('inventory.unknownRoute'))
        return
    }

    if (route.location !== sessionLocation.value) {
        signalRejected()
        notifyError(
            t('inventory.wrongLocation', {
                name: route.name || route.id,
                location: route.location || '—',
            }),
        )
        return
    }

    if (scannedRouteIds.value.includes(id)) {
        signalDuplicate()
        notifyWarning(
            t('inventory.alreadyCounted', { name: route.name || route.id }),
        )
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

onMounted(async () => {
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

/* ── Scanner viewport ────────────────────────────────────────────────── */
.scanner-viewport {
    position: relative;
    width: 100%;
    min-height: 250px;
    background: #111;
}

.scanner-viewport__placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.scanner-viewport__torch {
    position: absolute;
    top: 12px;
    right: 12px;
}

/* ── Status bar ──────────────────────────────────────────────────────── */
.status-bar {
    border-bottom: 1px solid
        rgba(var(--v-border-color), var(--v-border-opacity));
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
.scope-list {
    max-height: 320px;
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
    min-width: 28px;
    margin-right: 12px;
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
