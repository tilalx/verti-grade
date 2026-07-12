<template>
    <v-container fluid class="inventory-page pa-0">
        <!-- ── Desktop: not supported ─────────────────────────────────── -->
        <v-card
            v-if="!isMobile"
            flat
            class="pa-8 text-center ma-4"
            rounded="xl"
            border
        >
            <v-icon size="64" color="grey-lighten-1" class="mb-4"
                >mdi-cellphone</v-icon
            >
            <div class="text-h6 text-medium-emphasis mb-1">
                {{ $t('inventory.mobileOnly') }}
            </div>
        </v-card>

        <!-- ── Mobile scanner UI ──────────────────────────────────────── -->
        <template v-if="isMobile">
            <!-- Scanner viewport -->
            <div class="scanner-viewport">
                <QrcodeStream
                    v-if="cameraActive"
                    :formats="['qr_code']"
                    :constraints="{ facingMode: 'environment' }"
                    :paused="paused"
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
                        class="text-body-2 text-center px-6"
                        style="color: rgba(255, 255, 255, 0.6)"
                    >
                        {{ $t('inventory.subtitle') }}
                    </span>
                </div>
            </div>

            <!-- Status bar -->
            <div class="status-bar px-4 py-3">
                <div class="d-flex align-center justify-space-between">
                    <div class="d-flex ga-3">
                        <v-chip
                            size="small"
                            variant="tonal"
                            color="success"
                            prepend-icon="mdi-check-circle-outline"
                        >
                            {{ scannedRouteIds.length }}
                        </v-chip>
                        <v-chip
                            size="small"
                            variant="tonal"
                            color="warning"
                            prepend-icon="mdi-help-circle-outline"
                        >
                            {{ missingRoutes.length }}
                        </v-chip>
                    </div>
                    <v-btn
                        icon
                        variant="text"
                        size="small"
                        @click="instructionsDialog = true"
                    >
                        <v-icon>mdi-information-outline</v-icon>
                    </v-btn>
                </div>
            </div>

            <!-- Alerts -->
            <div
                v-if="successMessage || (!scanning && scannerError)"
                class="px-4 pt-2"
            >
                <v-alert
                    v-if="successMessage"
                    type="success"
                    variant="tonal"
                    density="compact"
                    closable
                    class="mb-2"
                    @click:close="successMessage = ''"
                >
                    {{ successMessage }}
                </v-alert>
                <v-alert
                    v-if="!scanning && scannerError"
                    type="error"
                    variant="tonal"
                    density="compact"
                    closable
                    class="mb-2"
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
                    variant="flat"
                    rounded="lg"
                    size="large"
                    class="flex-grow-1"
                    :disabled="loadingRoutes"
                    prepend-icon="mdi-camera"
                    @click="startScanner()"
                >
                    {{ $t('inventory.start') }}
                </v-btn>
                <v-btn
                    v-else
                    color="warning"
                    variant="flat"
                    rounded="lg"
                    size="large"
                    class="flex-grow-1"
                    prepend-icon="mdi-stop-circle"
                    @click="stopScanner()"
                >
                    {{ $t('inventory.stop') }}
                </v-btn>
                <v-btn
                    variant="tonal"
                    color="error"
                    rounded="lg"
                    size="large"
                    min-width="0"
                    :disabled="scannedRouteIds.length === 0 && !scanning"
                    @click="resetInventory()"
                >
                    <v-icon>mdi-refresh</v-icon>
                </v-btn>
            </div>

            <!-- Scanned routes list -->
            <div class="px-4 pt-4 pb-2">
                <div class="d-flex align-center justify-space-between mb-2">
                    <span
                        class="text-subtitle-2 font-weight-semibold text-medium-emphasis"
                    >
                        {{ $t('inventory.reviewFoundTitle') }}
                    </span>
                    <v-chip
                        v-if="scannedRoutes.length"
                        size="x-small"
                        variant="tonal"
                        color="success"
                    >
                        {{ scannedRoutes.length }}
                    </v-chip>
                </div>

                <template v-if="scannedRoutes.length">
                    <v-card
                        v-for="route in scannedRoutes"
                        :key="route.id"
                        rounded="lg"
                        border
                        flat
                        class="mb-2"
                    >
                        <div class="d-flex align-center pa-3">
                            <v-icon size="18" color="success" class="mr-3"
                                >mdi-check-circle</v-icon
                            >
                            <div class="flex-grow-1">
                                <div class="text-body-2 font-weight-medium">
                                    {{ route.name }}
                                </div>
                                <div class="text-caption text-medium-emphasis">
                                    {{ route.location || '—' }}
                                </div>
                            </div>
                            <v-chip
                                v-if="formatDifficulty(route)"
                                size="x-small"
                                variant="tonal"
                                color="primary"
                            >
                                {{ formatDifficulty(route) }}
                            </v-chip>
                        </div>
                    </v-card>
                </template>

                <div v-else class="text-center py-6">
                    <v-icon size="36" color="grey-lighten-1" class="mb-2"
                        >mdi-qrcode</v-icon
                    >
                    <div class="text-body-2 text-medium-emphasis">
                        {{ $t('inventory.noScans') }}
                    </div>
                </div>
            </div>

            <!-- Finish button -->
            <div v-if="scannedRouteIds.length > 0" class="px-4 pb-6 pt-2">
                <v-btn
                    color="success"
                    variant="flat"
                    block
                    rounded="xl"
                    size="large"
                    :disabled="loadingRoutes"
                    prepend-icon="mdi-check"
                    @click="openFinishDialog()"
                >
                    {{ $t('inventory.finish') }}
                </v-btn>
            </div>
        </template>

        <!-- ── Instructions dialog ────────────────────────────────────── -->
        <v-dialog v-model="instructionsDialog" max-width="400">
            <v-card rounded="xl">
                <v-card-title
                    class="text-body-1 font-weight-semibold pa-5 pb-2"
                >
                    {{ $t('inventory.instructionsTitle') }}
                </v-card-title>
                <v-card-text class="pa-5 pt-2">
                    <p class="text-body-2 text-medium-emphasis mb-3">
                        {{ $t('inventory.instructionsIntro') }}
                    </p>
                    <ol class="instructions-list text-body-2">
                        <li>{{ $t('inventory.instructionsStep1') }}</li>
                        <li>{{ $t('inventory.instructionsStep2') }}</li>
                        <li>{{ $t('inventory.instructionsStep3') }}</li>
                    </ol>
                </v-card-text>
                <v-card-actions class="pa-5 pt-0">
                    <v-spacer />
                    <v-btn
                        color="primary"
                        variant="flat"
                        rounded="lg"
                        @click="instructionsDialog = false"
                    >
                        {{ $t('inventory.instructionsClose') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- ── Finish review dialog ───────────────────────────────────── -->
        <v-dialog v-model="finishDialog" max-width="480">
            <v-card rounded="xl">
                <v-card-title
                    class="text-body-1 font-weight-semibold pa-5 pb-2"
                >
                    {{ $t('inventory.reviewTitle') }}
                </v-card-title>
                <v-card-text class="pa-5 pt-2">
                    <!-- Found routes -->
                    <div class="mb-4">
                        <div class="text-subtitle-2 font-weight-semibold mb-2">
                            {{ $t('inventory.reviewFoundTitle') }}
                            <v-chip
                                size="x-small"
                                variant="tonal"
                                color="success"
                                class="ml-1"
                            >
                                {{ scannedRoutes.length }}
                            </v-chip>
                        </div>
                        <v-list
                            density="compact"
                            class="review-list rounded-lg"
                            border
                        >
                            <v-list-item
                                v-for="route in scannedRoutes"
                                :key="`found-${route.id}`"
                            >
                                <v-list-item-title class="text-body-2">
                                    {{ route.name || route.id }}
                                </v-list-item-title>
                                <v-list-item-subtitle class="text-caption">
                                    {{ route.location || '—' }}
                                </v-list-item-subtitle>
                                <template #prepend>
                                    <v-icon size="16" color="success"
                                        >mdi-check-circle</v-icon
                                    >
                                </template>
                            </v-list-item>
                            <v-list-item v-if="scannedRoutes.length === 0">
                                <v-list-item-title
                                    class="text-body-2 text-medium-emphasis"
                                >
                                    {{ $t('inventory.noScans') }}
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </div>

                    <!-- Missing routes -->
                    <div>
                        <div class="text-subtitle-2 font-weight-semibold mb-1">
                            {{ $t('inventory.reviewMissingTitle') }}
                            <v-chip
                                size="x-small"
                                variant="tonal"
                                color="error"
                                class="ml-1"
                            >
                                {{ archivePreview.length }}
                            </v-chip>
                        </div>
                        <p
                            v-if="archivePreview.length"
                            class="text-caption text-medium-emphasis mb-2"
                        >
                            {{ $t('inventory.reviewMissingDescription') }}
                        </p>
                        <v-list
                            density="compact"
                            class="review-list rounded-lg"
                            border
                        >
                            <v-list-item
                                v-for="route in archivePreview"
                                :key="`missing-${route.id}`"
                            >
                                <v-list-item-title class="text-body-2">
                                    {{ route.name }}
                                </v-list-item-title>
                                <v-list-item-subtitle class="text-caption">
                                    {{ route.location || '—' }}
                                </v-list-item-subtitle>
                                <template #prepend>
                                    <v-icon size="16" color="error"
                                        >mdi-alert-circle</v-icon
                                    >
                                </template>
                            </v-list-item>
                            <v-list-item v-if="archivePreview.length === 0">
                                <v-list-item-title
                                    class="text-body-2 text-medium-emphasis"
                                >
                                    {{ $t('inventory.nothingToArchive') }}
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </div>
                </v-card-text>
                <v-card-actions class="pa-5 pt-0">
                    <v-btn variant="text" @click="finishDialog = false">
                        {{ $t('actions.cancel') }}
                    </v-btn>
                    <v-spacer />
                    <v-btn
                        color="primary"
                        variant="flat"
                        rounded="lg"
                        prepend-icon="mdi-check"
                        @click="confirmFinish"
                    >
                        {{ $t('actions.save') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup>
import { QrcodeStream } from 'vue-qrcode-reader'
import { formatDifficulty } from '~/utils/formatting'

definePageMeta({
    middleware: 'auth',
    authRequired: true,
    requiredPermission: 'run_inventory',
})

const { t } = useI18n()
const pb = usePocketbase()
const { smAndDown } = useDisplay()
const { warning: notifyStorageWarning } = useNotification()
let storageWarningShown = false

const isMobile = computed(() => smAndDown.value)
const scanning = ref(false)
const cameraActive = ref(false)
const paused = ref(false)
const scannerError = ref('')
const successMessage = ref('')
const instructionsDialog = ref(false)
const lastScannedRoute = ref(null)
const scannedRouteIds = ref([])
const scannedRoutes = ref([])
const allRoutes = ref([])
const loadingRoutes = ref(false)

const finishDialog = ref(false)
const archivePreview = ref([])

const STORAGE_KEY = 'inventory-scanned-route-ids'

const activeRoutes = computed(() =>
    allRoutes.value.filter((route) => route.archived !== true),
)
const missingRoutes = computed(() =>
    activeRoutes.value.filter(
        (route) => !scannedRouteIds.value.includes(route.id),
    ),
)
const currentDifficulty = computed(() =>
    formatDifficulty(lastScannedRoute.value),
)

const loadStoredScannedIds = () => {
    if (!process.client) {
        return []
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) {
            return []
        }

        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) {
            return []
        }

        return parsed.filter(
            (value) => typeof value === 'string' && value.length > 0,
        )
    } catch (error) {
        console.warn('Failed to restore scanned routes from storage:', error)
        warnStorageUnavailable()
        return []
    }
}

const warnStorageUnavailable = () => {
    if (storageWarningShown) return
    storageWarningShown = true
    notifyStorageWarning(t('inventory.storageWarning'))
}

const persistScannedIds = (ids) => {
    if (!process.client) {
        return
    }

    try {
        if (Array.isArray(ids) && ids.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
        } else {
            localStorage.removeItem(STORAGE_KEY)
        }
    } catch (error) {
        console.warn('Failed to persist scanned routes to storage:', error)
        warnStorageUnavailable()
    }
}

let hydrateRunId = 0
const hydrateScannedRoutes = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) {
        scannedRoutes.value = []
        lastScannedRoute.value = null
        return
    }

    const token = ++hydrateRunId
    const uniqueIds = Array.from(new Set(ids))

    const cachedMap = new Map(allRoutes.value.map((r) => [r.id, r]))
    const uncachedIds = uniqueIds.filter((id) => !cachedMap.has(id))

    if (uncachedIds.length > 0) {
        const fetched = await Promise.all(
            uncachedIds.map((id) =>
                pb
                    .collection('routes')
                    .getOne(id, {
                        fields: 'id,name,location,difficulty,difficulty_sign,archived',
                    })
                    .catch((error) => {
                        console.warn(
                            'Failed to hydrate scanned route:',
                            id,
                            error,
                        )
                        return null
                    }),
            ),
        )
        const newRoutes = fetched.filter(Boolean)
        allRoutes.value = [...allRoutes.value, ...newRoutes]
        newRoutes.forEach((r) => cachedMap.set(r.id, r))
    }

    if (token !== hydrateRunId) {
        return
    }

    const resolved = uniqueIds.map((id) => cachedMap.get(id)).filter(Boolean)

    if (process.client && resolved.length !== uniqueIds.length) {
        const cleanedIds = resolved.map((route) => route.id)
        const existingIds = scannedRouteIds.value

        const differsInLength = cleanedIds.length !== existingIds.length
        const differsInOrder = cleanedIds.some(
            (id, index) => id !== existingIds[index],
        )

        if (differsInLength || differsInOrder) {
            persistScannedIds(cleanedIds)
            scannedRouteIds.value = cleanedIds
        }
    }

    scannedRoutes.value = resolved
    lastScannedRoute.value = resolved[resolved.length - 1] ?? null
}

const resetInventory = async (options = {}) => {
    const { preserveMessages = false } = options

    stopScanner()
    if (!preserveMessages) {
        successMessage.value = ''
        scannerError.value = ''
    }
    finishDialog.value = false
    archivePreview.value = []
    scannedRouteIds.value = []
    scannedRoutes.value = []
    lastScannedRoute.value = null
    persistScannedIds([])
}

watch(isMobile, (value) => {
    if (!value) {
        instructionsDialog.value = false
        stopScanner()
    } else {
        instructionsDialog.value = true
    }
})

watch(
    scannedRouteIds,
    (ids) => {
        if (!process.client) {
            return
        }
        persistScannedIds(ids)
        void hydrateScannedRoutes(ids)
    },
    { flush: 'post' },
)

const trackQrCode = (detectedCodes, ctx) => {
    for (const code of detectedCodes) {
        const { boundingBox } = code
        if (!boundingBox) continue
        const id = extractRouteId(code.rawValue)
        const route = id ? allRoutes.value.find((r) => r.id === id) : null
        const color = route ? '#1D9E75' : '#EF4444'

        ctx.lineWidth = 3
        ctx.strokeStyle = color
        ctx.strokeRect(
            boundingBox.x,
            boundingBox.y,
            boundingBox.width,
            boundingBox.height,
        )

        const label = route ? route.name : t('inventory.invalidCode')
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

const onDetect = (detectedCodes) => {
    if (!Array.isArray(detectedCodes) || detectedCodes.length === 0) return
    for (const code of detectedCodes) {
        if (code.rawValue) void handleScanResult(code.rawValue)
    }
}

const onCameraOn = () => {
    scanning.value = true
    scannerError.value = ''
}

const onCameraError = (error) => {
    console.error('Camera error:', error)
    scanning.value = false
    cameraActive.value = false
    if (error?.name === 'NotAllowedError' || error?.name === 'NotFoundError') {
        scannerError.value = t('inventory.cameraError')
    } else {
        scannerError.value = error?.message || t('inventory.cameraError')
    }
}

const loadRoutes = async () => {
    loadingRoutes.value = true
    try {
        const list = await pb.collection('routes').getFullList({
            fields: 'id,name,location,difficulty,difficulty_sign,archived',
            $autoCancel: false,
        })
        allRoutes.value = list
        if (process.client) {
            await hydrateScannedRoutes(scannedRouteIds.value)
        }
    } catch (error) {
        if (error?.message?.includes('autocancelled')) {
            return
        }
        console.error('Failed to load routes for inventory:', error)
        scannerError.value = t('inventory.loadError')
    } finally {
        loadingRoutes.value = false
    }
}

const extractRouteId = (value) => {
    if (!value) {
        return null
    }

    const trimmed = String(value).trim()

    try {
        const url = new URL(trimmed)
        const id = url.searchParams.get('id')
        if (id) {
            return id
        }
    } catch (error) {
        // Ignore parsing errors and try the plain value fallback.
    }
    const queryStart = trimmed.indexOf('?')
    if (queryStart !== -1) {
        const queryPart = trimmed.slice(queryStart + 1)
        const params = new URLSearchParams(queryPart)
        const idParam = params.get('id')
        if (idParam) {
            return idParam
        }
    }

    if (/^[a-z0-9]{10,}$/i.test(trimmed)) {
        return trimmed
    }

    return null
}

const addScannedRoute = async (id) => {
    if (scannedRouteIds.value.includes(id)) {
        const existing =
            scannedRoutes.value.find((item) => item.id === id) ||
            allRoutes.value.find((item) => item.id === id) ||
            null
        lastScannedRoute.value = existing
        return
    }

    try {
        let route = allRoutes.value.find((item) => item.id === id)
        if (!route) {
            route = await pb.collection('routes').getOne(id, {
                fields: 'id,name,location,difficulty,difficulty_sign,archived',
            })
            allRoutes.value = [...allRoutes.value, route]
        }

        if (route?.archived) {
            try {
                await pb
                    .collection('routes')
                    .update(route.id, { archived: false })
                route = { ...route, archived: false }
                successMessage.value = t('inventory.restoreSuccess', {
                    name: route.name || route.id,
                })
                allRoutes.value = allRoutes.value.map((item) =>
                    item.id === route.id ? { ...item, archived: false } : item,
                )
            } catch (error) {
                console.error('Failed to restore archived route:', error)
                scannerError.value = t('inventory.restoreError')
                return
            }
        }

        scannedRouteIds.value = [...scannedRouteIds.value, id]

        if (!scannedRoutes.value.some((item) => item.id === id)) {
            scannedRoutes.value = [...scannedRoutes.value, route]
        } else {
            scannedRoutes.value = scannedRoutes.value.map((item) =>
                item.id === id ? route : item,
            )
        }

        lastScannedRoute.value = route
        scannerError.value = ''
    } catch (error) {
        console.error('Failed to resolve scanned route:', error)
        scannerError.value = t('inventory.unknownRoute')
        lastScannedRoute.value = null
    }
}

const recentScans = new Map()
const SCAN_COOLDOWN_MS = 2000

const handleScanResult = async (text) => {
    const id = extractRouteId(text)
    if (!id) {
        scannerError.value = t('inventory.invalidCode')
        return
    }

    // Skip if same QR code scanned within cooldown window
    const now = Date.now()
    const lastTime = recentScans.get(id) ?? 0
    if (now - lastTime < SCAN_COOLDOWN_MS) {
        return
    }
    recentScans.set(id, now)

    scannerError.value = ''
    await addScannedRoute(id)
}

const startScanner = () => {
    if (!process.client || !isMobile.value) return
    scannerError.value = ''
    successMessage.value = ''
    paused.value = false
    cameraActive.value = true
}

const stopScanner = () => {
    cameraActive.value = false
    scanning.value = false
    paused.value = false
}

const openFinishDialog = () => {
    stopScanner()
    archivePreview.value = missingRoutes.value.map((route) => ({ ...route }))
    finishDialog.value = true
}

const confirmFinish = async () => {
    const missing = archivePreview.value.map((route) => route.id)
    let successText = ''

    if (missing.length > 0) {
        try {
            const batch = pb.createBatch()
            missing.forEach((id) => {
                batch.collection('routes').update(id, { archived: true })
            })
            await batch.send()
            successText = t('inventory.archiveSuccess', {
                count: missing.length,
            })
        } catch (error) {
            console.error('Failed to archive routes:', error)
            scannerError.value = t('inventory.archiveError')
            successText = ''
        }
    } else {
        successText = t('inventory.nothingToArchive')
    }

    await resetInventory({ preserveMessages: true })

    if (successText) {
        successMessage.value = successText
    }

    await loadRoutes()
}

onMounted(async () => {
    instructionsDialog.value = isMobile.value
    await loadRoutes()

    const storedIds = loadStoredScannedIds()
    if (storedIds.length > 0) {
        scannedRouteIds.value = storedIds
        await hydrateScannedRoutes(storedIds)
    } else {
        await hydrateScannedRoutes([])
    }
})

onBeforeUnmount(() => {
    stopScanner()
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

/* ── Review dialog lists ─────────────────────────────────────────────── */
.review-list {
    max-height: 200px;
    overflow-y: auto;
}
</style>
