<template>
    <div class="scan-page" data-testid="scan-page">
        <h1 class="d-sr-only">{{ $t('scan.title') }}</h1>

        <div v-if="cameraActive" ref="viewportRef" class="scan-viewport">
            <QrStream
                :formats="['QRCode']"
                :constraints="cameraConstraints"
                :tag="tagFor"
                @frame="onFrame"
                @camera-on="onCameraOn"
                @error="onCameraError"
            />
            <div class="scan-frame" aria-hidden="true" />
            <div
                v-if="!scanning"
                class="scan-starting"
                data-testid="scan-starting"
            >
                <v-progress-circular indeterminate size="32" />
                <span class="scan-starting__text">{{
                    $t('scan.starting')
                }}</span>
            </div>
            <v-btn
                v-if="scanning && torchSupported"
                class="scan-torch"
                :icon="torchOn ? 'mdi-flashlight' : 'mdi-flashlight-off'"
                :color="torchOn ? 'warning' : undefined"
                variant="flat"
                :aria-label="$t('inventory.toggleTorch')"
                data-testid="scan-torch"
                @click="toggleTorch"
            />
        </div>

        <div v-else class="scan-idle">
            <v-icon size="72" class="scan-idle__icon">mdi-qrcode-scan</v-icon>
            <p class="text-title-medium mb-2">{{ $t('scan.title') }}</p>
            <p class="text-body-medium text-medium-emphasis mb-6">
                {{ $t('scan.intro') }}
            </p>
            <v-alert
                v-if="scannerError"
                type="warning"
                variant="tonal"
                class="mb-4 text-left"
                data-testid="scan-error"
            >
                {{ scannerError }}
            </v-alert>
            <v-btn
                color="primary"
                size="large"
                prepend-icon="mdi-camera-outline"
                data-testid="scan-start"
                @click="start"
            >
                {{ $t('scan.start') }}
            </v-btn>
        </div>

        <p
            class="scan-hint text-body-small text-medium-emphasis"
            aria-live="polite"
            data-testid="scan-hint"
        >
            {{ hint }}
        </p>
        <div class="scan-actions">
            <v-btn
                to="/map"
                variant="text"
                prepend-icon="mdi-map-outline"
                data-testid="scan-open-map"
            >
                {{ $t('scan.findOnMap') }}
            </v-btn>
        </div>
    </div>
</template>

<script setup lang="ts">
import { extractRouteId } from '~/utils/inventory'
import { centeredCode, type ScannedCode, type Size } from '~/utils/qr'
import { formatGrade } from '#shared/utils/grades'
import type { RouteRecord } from '~/types/models'

definePageMeta({ footer: false })

const REJECT_COOLDOWN_MS = 1500
const FRAME_RADIUS = 0.25
const KNOWN_COLOR = '#43A047'
const UNKNOWN_COLOR = '#E53935'
const PENDING_COLOR = '#FFFFFF'
const REJECT_MESSAGE_MS = 2500

const { t } = useI18n()
const pb = usePocketbase()

useSeoMeta({ title: () => t('page.title.scan') })

const viewportRef = useTemplateRef<HTMLElement>('viewportRef')
const {
    scanning,
    cameraActive,
    torchOn,
    torchSupported,
    scannerError,
    start,
    stop,
    toggleTorch,
    onCameraOn,
    onCameraError,
    signalAccepted,
    signalRejected,
} = useQrScanner(viewportRef, () => t('scan.cameraError'))

const cameraConstraints = {
    facingMode: 'environment',
    width: { ideal: 1280 },
    height: { ideal: 720 },
}

const routes = reactive(new Map<string, RouteRecord | null>())
const offCenter = ref(false)
const opening = ref(false)
const rejected = ref(false)
let lastRejectedAt = 0
let rejectedTimer: ReturnType<typeof setTimeout> | undefined

const hint = computed(() => {
    if (opening.value) return t('scan.opening')
    if (rejected.value) return t('scan.notARoute')
    if (offCenter.value) return t('scan.center')
    return scanning.value ? t('scan.aim') : ''
})

function lookup(routeId: string) {
    if (routes.has(routeId)) return
    routes.set(routeId, null)
    pb.collection('routes')
        .getOne<RouteRecord>(routeId, {
            fields: 'id,name,grade,grade_system',
            requestKey: null,
        })
        .then((route) => routes.set(routeId, route))
        .catch(() => routes.set(routeId, { id: '', name: '', grade: '' }))
}

function knownRoute(routeId: string | null) {
    const route = routeId ? routes.get(routeId) : undefined
    if (route === undefined || route === null) return undefined
    return route.id ? route : false
}

function tagFor(rawValue: string) {
    const route = knownRoute(extractRouteId(rawValue))
    if (route === undefined) return { color: PENDING_COLOR, label: '…' }
    if (!route) return { color: UNKNOWN_COLOR, label: t('scan.unknownRoute') }
    const grade = formatGrade(route)
    return {
        color: KNOWN_COLOR,
        label: grade ? `${route.name} · ${grade}` : route.name,
    }
}

async function openRoute(routeId: string) {
    opening.value = true
    signalAccepted()
    stop()
    await navigateTo({ path: '/route', query: { id: routeId } })
}

function reject() {
    const now = Date.now()
    if (now - lastRejectedAt < REJECT_COOLDOWN_MS) return
    lastRejectedAt = now
    rejected.value = true
    signalRejected()
    clearTimeout(rejectedTimer)
    rejectedTimer = setTimeout(() => {
        rejected.value = false
    }, REJECT_MESSAGE_MS)
}

function onFrame(codes: ScannedCode[], video: Size) {
    if (opening.value) return
    const routeCodes = codes.filter((code) => extractRouteId(code.rawValue))
    for (const code of routeCodes) lookup(extractRouteId(code.rawValue)!)
    if (codes.length && !routeCodes.length) {
        reject()
        return
    }
    const centered = centeredCode(routeCodes, video, FRAME_RADIUS)
    offCenter.value = routeCodes.length > 0 && !centered
    if (!centered) return
    const routeId = extractRouteId(centered.rawValue)!
    const route = knownRoute(routeId)
    if (route) void openRoute(routeId)
    else if (route === false) reject()
}

onMounted(start)
onBeforeUnmount(() => clearTimeout(rejectedTimer))
</script>

<style scoped>
.scan-page {
    display: flex;
    flex-direction: column;
    min-height: calc(
        100dvh - var(--v-layout-top, 64px) - var(--v-layout-bottom, 0px)
    );
}

.scan-viewport {
    position: relative;
    flex: 1;
    min-height: 320px;
    background: #111;
    overflow: hidden;
}

.scan-viewport :deep(.qr-stream) {
    position: absolute;
    inset: 0;
}

.scan-frame {
    position: absolute;
    top: 50%;
    left: 50%;
    width: min(64vw, 280px);
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    border: 3px solid rgba(255, 255, 255, 0.85);
    border-radius: 20px;
    box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.35);
    pointer-events: none;
}

.scan-starting {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 0 32px;
    color: rgba(255, 255, 255, 0.85);
}

.scan-starting__text {
    max-width: min(56vw, 240px);
    text-align: center;
    font-size: 0.875rem;
    line-height: 1.4;
}

.scan-torch {
    position: absolute;
    right: 16px;
    bottom: 16px;
}

.scan-idle {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    text-align: center;
}

.scan-idle__icon {
    color: rgba(var(--v-theme-on-surface), 0.3);
    margin-bottom: 16px;
}

.scan-hint {
    min-height: 1.5em;
    margin: 12px 16px 0;
    text-align: center;
}

.scan-actions {
    display: flex;
    justify-content: center;
    padding: 4px 16px 12px;
}
</style>
