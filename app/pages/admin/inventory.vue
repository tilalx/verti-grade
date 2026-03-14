<template>
    <v-container class="inventory-scan">
        <NewVersionAvailable />

        <v-alert v-if="!isMobile" type="warning" class="mb-4" variant="tonal">
            {{ $t('inventory.mobileOnly') }}
        </v-alert>

        <v-dialog v-model="instructionsDialog" max-width="420">
            <v-card>
                <v-card-title>{{
                    $t('inventory.instructionsTitle')
                }}</v-card-title>
                <v-card-text>
                    <p class="inventory-scan__instructions-intro">
                        {{ $t('inventory.instructionsIntro') }}
                    </p>
                    <ol class="inventory-scan__instructions-list">
                        <li>{{ $t('inventory.instructionsStep1') }}</li>
                        <li>{{ $t('inventory.instructionsStep2') }}</li>
                        <li>{{ $t('inventory.instructionsStep3') }}</li>
                    </ol>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn
                        color="primary"
                        variant="flat"
                        @click="instructionsDialog = false"
                    >
                        {{ $t('inventory.instructionsClose') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <div v-if="isMobile" class="inventory-scan__toolbar">
            <v-btn
                color="primary"
                variant="text"
                @click="instructionsDialog = true"
            >
                <v-icon start>mdi-information-outline</v-icon>
                {{ $t('inventory.showInstructions') }}
            </v-btn>
        </div>

        <v-card
            v-if="isMobile"
            :loading="loadingRoutes"
            class="inventory-scan__card"
            elevation="2"
        >
            <v-card-text>
                <div class="inventory-scan__video-wrapper">
                    <div
                        :id="scannerElementId"
                        ref="scannerRef"
                        class="inventory-scan__video"
                    />
                </div>
                <v-alert
                    type="info"
                    variant="tonal"
                    class="inventory-scan__info-bar"
                >
                    <div class="inventory-scan__info-main">
                        <strong v-if="lastScannedRoute">
                            {{ lastScannedRoute.name }}
                        </strong>
                        <strong v-else>{{ $t('inventory.noScans') }}</strong>
                        <span v-if="lastScannedRoute">
                            • {{ lastScannedRoute.location || '—' }}
                            <template v-if="currentDifficulty">
                                • {{ currentDifficulty }}
                            </template>
                        </span>
                    </div>
                    <div class="inventory-scan__info-meta">
                        {{
                            $t('inventory.scannedCount', {
                                count: scannedRouteIds.length,
                            })
                        }}
                        ·
                        {{
                            $t('inventory.pendingCount', {
                                count: missingRoutes.length,
                            })
                        }}
                    </div>
                </v-alert>
                <v-divider class="my-4" />
                <v-alert
                    v-if="successMessage"
                    type="success"
                    class="mb-4"
                    variant="tonal"
                    closable
                    @click:close="successMessage = ''"
                >
                    {{ successMessage }}
                </v-alert>

                <v-alert
                    v-if="scannerError"
                    type="error"
                    class="mb-4"
                    variant="tonal"
                    closable
                    @click:close="scannerError = ''"
                >
                    {{ scannerError }}
                </v-alert>
            </v-card-text>
            <v-card-actions class="inventory-scan__actions">
                <v-btn
                    v-if="!scanning"
                    color="primary"
                    variant="flat"
                    :disabled="loadingRoutes"
                    class="inventory-scan__action-btn"
                    @click="startScanner()"
                >
                    <v-icon start>mdi-camera</v-icon>
                    {{ $t('inventory.start') }}
                </v-btn>
                <v-btn
                    v-else
                    color="warning"
                    variant="flat"
                    @click="stopScanner()"
                    class="inventory-scan__action-btn"
                >
                    <v-icon start>mdi-stop-circle</v-icon>
                    {{ $t('inventory.stop') }}
                </v-btn>
                <v-btn
                    color="error"
                    variant="flat"
                    :disabled="scannedRouteIds.length === 0 && !scanning"
                    class="inventory-scan__action-btn"
                    @click="resetInventory()"
                >
                    <v-icon start>mdi-refresh</v-icon>
                    {{ $t('inventory.reset') }}
                </v-btn>
            </v-card-actions>
        </v-card>

        <v-card v-if="isMobile" class="inventory-scan__list" elevation="1">
            <v-card-title>
                {{
                    $t('inventory.scannedCount', {
                        count: scannedRouteIds.length,
                    })
                }}
            </v-card-title>
            <v-divider />
            <v-list density="comfortable">
                <v-list-item v-for="route in scannedRoutes" :key="route.id">
                    <v-list-item-title>{{ route.name }}</v-list-item-title>
                    <v-list-item-subtitle>
                        {{ route.location || '—' }}
                    </v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="scannedRoutes.length === 0">
                    <v-list-item-title>{{
                        $t('inventory.noScans')
                    }}</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-card>

        <div v-if="isMobile" class="inventory-scan__footer">
            <v-btn
                color="success"
                variant="flat"
                class="inventory-scan__footer-btn"
                :disabled="loadingRoutes || allRoutes.length === 0"
                @click="openFinishDialog()"
            >
                <v-icon start>mdi-check</v-icon>
                {{ $t('inventory.finish') }}
            </v-btn>
        </div>

        <v-dialog v-model="finishDialog" max-width="480">
            <v-card>
                <v-card-title>{{ $t('inventory.reviewTitle') }}</v-card-title>
                <v-card-text>
                    <div class="inventory-scan__review-section">
                        <h3>{{ $t('inventory.reviewFoundTitle') }}</h3>
                        <v-list
                            density="compact"
                            class="inventory-scan__dialog-list"
                        >
                            <v-list-item
                                v-for="route in scannedRoutes"
                                :key="`found-${route.id}`"
                            >
                                <v-list-item-title>
                                    {{ route.name || route.id }}
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    {{ route.location || '—' }}
                                </v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item v-if="scannedRoutes.length === 0">
                                <v-list-item-title>{{
                                    $t('inventory.noScans')
                                }}</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </div>
                    <div class="inventory-scan__review-section">
                        <h3>{{ $t('inventory.reviewMissingTitle') }}</h3>
                        <p v-if="archivePreview.length" class="inventory-scan__dialog-text">
                            {{ $t('inventory.reviewMissingDescription') }}
                        </p>
                        <v-list
                            density="compact"
                            class="inventory-scan__dialog-list"
                        >
                            <v-list-item
                                v-for="route in archivePreview"
                                :key="`missing-${route.id}`"
                            >
                                <v-list-item-title>{{
                                    route.name
                                }}</v-list-item-title>
                                <v-list-item-subtitle>{{
                                    route.location || '—'
                                }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item v-if="archivePreview.length === 0">
                                <v-list-item-title>{{
                                    $t('inventory.nothingToArchive')
                                }}</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-btn
                        color="primary"
                        variant="flat"
                        @click="confirmFinish"
                    >
                        <v-icon start>mdi-check</v-icon>
                        {{ $t('actions.save') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { usePocketbase } from '@/composables/pocketbase.js'
import NewVersionAvailable from '@/components/notifications/newVersionAvailable.vue'

definePageMeta({
    middleware: 'auth',
    authRequired: true,
})

const { t } = useI18n()
const pb = usePocketbase()
const { smAndDown } = useDisplay()

const isMobile = computed(() => smAndDown.value)
const scannerRef = ref(null)
const scannerElementId = 'inventory-scanner-view'
const scanning = ref(false)
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

let html5QrCodeInstance = null

const CAMERA_PREFERENCE_REGEX = /(back|rear|environment)/i
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

        return parsed
            .filter((value) => typeof value === 'string' && value.length > 0)
    } catch (error) {
        console.warn('Failed to restore scanned routes from storage:', error)
        return []
    }
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
    const resolved = []

    for (const id of uniqueIds) {
        let route = allRoutes.value.find((item) => item.id === id)

        if (!route) {
            try {
                route = await pb.collection('routes').getOne(id, {
                    fields: 'id,name,location,difficulty,difficulty_sign,archived',
                })
                allRoutes.value = [...allRoutes.value, route]
            } catch (error) {
                console.warn('Failed to hydrate scanned route:', id, error)
                continue
            }
        }

        resolved.push(route)
    }

    if (token !== hydrateRunId) {
        return
    }

    if (
        process.client &&
        resolved.length !== uniqueIds.length
    ) {
        const cleanedIds = resolved.map((route) => route.id)
        const existingIds = scannedRouteIds.value

        const differsInLength = cleanedIds.length !== existingIds.length
        const differsInOrder = cleanedIds.some((id, index) => id !== existingIds[index])

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

    await stopScanner()
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
        void stopScanner()
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

const pickPreferredCameraId = async (Html5QrcodeClass) => {
    try {
        const cameras = await Html5QrcodeClass.getCameras()
        if (!Array.isArray(cameras) || cameras.length === 0) {
            return null
        }

        const normalised = cameras
            .map((camera) => ({
                id: camera.id ?? camera.deviceId ?? null,
                label: camera.label ?? '',
            }))
            .filter((camera) => Boolean(camera.id))

        if (normalised.length === 0) {
            return null
        }

        const preferred = normalised.find((camera) =>
            CAMERA_PREFERENCE_REGEX.test(camera.label),
        )
        return preferred?.id ?? normalised[0]?.id ?? null
    } catch (error) {
        console.error('Failed to enumerate cameras:', error)
        return null
    }
}

const buildCameraConfig = (deviceId) => {
    if (deviceId) {
        return { deviceId: { exact: deviceId } }
    }

    return { facingMode: { ideal: 'environment' } }
}

const resolveQrBoxSize = () => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // On phones/iPads we size based on width,
  // but ensure it also fits height (e.g. landscape mode)

  // Base size: 55% of viewport width
  let size = vw * 0.55;

  // Fit inside height in landscape mode (common issue on iPads)
  size = Math.min(size, vh * 0.70);

  // Reasonable constraints for mobile/iPad use
  const MIN = 180; // small phones
  const MAX = 420; // iPhone Pro Max / iPad

  return Math.round(Math.max(MIN, Math.min(MAX, size)));
};


const shouldIgnoreScanError = (error) => {
    if (!error) {
        return true
    }

    const message = typeof error === 'string' ? error : error?.message
    if (!message) {
        return true
    }

    const lower = message.toLowerCase()

    return (
        message.includes('NotFoundException') ||
        message.includes('FormatException') ||
        lower.includes('qr code parse error') ||
        lower.includes('no multiformat readers were able to detect the code')
    )
}

function formatDifficulty(route) {
    if (!route) {
        return ''
    }

    const base = (() => {
        if (typeof route.difficulty === 'number') {
            return route.difficulty.toString()
        }
        if (typeof route.difficulty === 'string') {
            return route.difficulty.trim()
        }
        return ''
    })()

    const sign =
        route.difficulty_sign === true
            ? '+'
            : route.difficulty_sign === false
              ? '-'
              : typeof route.difficulty_sign === 'string'
                ? route.difficulty_sign
                : ''

    return `${base}${sign}`.trim()
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

const handleScanResult = async (text) => {
    const id = extractRouteId(text)
    if (!id) {
        scannerError.value = t('inventory.invalidCode')
        return
    }

    scannerError.value = ''
    await addScannedRoute(id)
}

const startScanner = async () => {
    if (!process.client || scanning.value || !isMobile.value) {
        return
    }

    if (!scannerRef.value) {
        scannerError.value = t('inventory.cameraError')
        return
    }

    scannerError.value = ''
    successMessage.value = ''

    try {
        await nextTick()
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
            'html5-qrcode'
        )

        await stopScanner()

        const deviceId = await pickPreferredCameraId(Html5Qrcode)
        const cameraConfig = buildCameraConfig(deviceId)
        const qrBox = resolveQrBoxSize()

        html5QrCodeInstance = new Html5Qrcode(scannerElementId, {
            verbose: false,
        })

        console.debug('Starting scanner with config:', {
            cameraConfig,
            qrBox,
        })

        const config = {
            fps: 10,
            qrbox: qrBox,
            disableFlip: true,
            rememberLastUsedCamera: true,
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true,
            },
        }

        await html5QrCodeInstance.start(
            cameraConfig,
            config,
            (decodedText) => {
                console.debug('QR result', decodedText)
                void handleScanResult(decodedText)
            },
            (errorMessage) => {
                if (shouldIgnoreScanError(errorMessage)) {
                    return
                }

                console.error('Scanner error:', errorMessage)
                scannerError.value =
                    (typeof errorMessage === 'string' && errorMessage) ||
                    t('inventory.invalidCode')
            },
        )

        scanning.value = true
    } catch (error) {
        console.error('Failed to start scanner:', error)
        if (
            error?.name === 'NotAllowedError' ||
            error?.name === 'NotFoundError'
        ) {
            scannerError.value = t('inventory.cameraError')
        } else {
            scannerError.value = error?.message || t('inventory.invalidCode')
        }
        await stopScanner()
    }
}

const stopScanner = async () => {
    if (!html5QrCodeInstance) {
        scanning.value = false
        return
    }

    try {
        if (html5QrCodeInstance.isScanning) {
            await html5QrCodeInstance.stop()
        }
        await html5QrCodeInstance.clear()
    } catch (error) {
        console.warn('Failed to stop scanner:', error)
    } finally {
        html5QrCodeInstance = null
        scanning.value = false
    }
}

const openFinishDialog = async () => {
    await stopScanner()
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
            successText = t('inventory.archiveSuccess', { count: missing.length })
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
    void stopScanner()
})
</script>

<style scoped>
.inventory-scan {
    padding-bottom: 64px;
    padding: 0px;
}

.inventory-scan__toolbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.inventory-scan__card {
    margin-bottom: 16px;
}

.inventory-scan__video-wrapper {
    position: relative;
    width: 100%;
}

.inventory-scan__video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.inventory-scan__video :deep(video) {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.inventory-scan__video :deep(canvas) {
    display: none;
}

.inventory-scan__info-bar {
    margin-top: 12px;
}

.inventory-scan__info-main {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
}

.inventory-scan__info-main strong {
    font-weight: 600;
}

.inventory-scan__info-meta {
    margin-top: 4px;
    font-size: 0.875rem;
    color: rgba(var(--v-theme-on-surface), 0.7);
}

.inventory-scan__instructions-intro {
    margin-bottom: 8px;
}

.inventory-scan__instructions-list {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.inventory-scan__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
}

.inventory-scan__action-btn {
    flex: 1 1 160px;
    min-width: 140px;
}

@media (max-width: 360px) {
    .inventory-scan__action-btn {
        flex-basis: 100%;
    }
}

.inventory-scan__footer {
    margin-top: 24px;
}

.inventory-scan__footer-btn {
    width: 100%;
}

.inventory-scan__review-section {
    margin-bottom: 24px;
}

.inventory-scan__review-section h3 {
    margin: 0 0 8px;
    font-size: 1rem;
    font-weight: 600;
}

.inventory-scan__list {
    margin-top: 16px;
}

.inventory-scan__dialog-text {
    margin-bottom: 8px;
}

.inventory-scan__dialog-list {
    max-height: 240px;
    overflow-y: auto;
}
</style>
