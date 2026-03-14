<template>
    <v-container fluid class="pa-6">

        <!-- Image Upload Cards -->
        <v-row class="mb-4" density="comfortable">
            <v-col
                v-for="asset in assetFields"
                :key="asset.key"
                cols="12"
                sm="4"
            >
                <v-card
                    rounded="lg"
                    border
                    flat
                    :class="{ 'border-primary': asset.isDirty }"
                    style="transition: border-color 0.2s"
                >
                    <v-card-text class="pa-4">
                        <div class="d-flex align-center justify-space-between mb-3">
                            <span class="text-subtitle-2 font-weight-semibold">
                                {{ asset.label }}
                            </span>
                            <v-chip
                                v-if="asset.isDirty"
                                color="warning"
                                size="x-small"
                                variant="tonal"
                            >
                                Changed
                            </v-chip>
                        </div>

                        <!-- Preview + Upload combined area -->
                        <div
                            class="asset-drop-zone d-flex flex-column align-center justify-center rounded-lg position-relative"
                            style="height: 160px; border: 1.5px dashed rgba(255,255,255,0.12); overflow: hidden; cursor: pointer"
                            @click="() => asset.triggerInput()"
                        >
                            <!-- Preview image when available -->
                            <NuxtImg
                                v-if="asset.preview.value"
                                :src="asset.preview.value"
                                style="max-height: 130px; max-width: 100%; object-fit: contain; display: block"
                            />

                            <!-- Empty state -->
                            <template v-else>
                                <v-icon size="28" class="mb-2 text-medium-emphasis">mdi-image-plus-outline</v-icon>
                                <span class="text-caption text-medium-emphasis">Click to upload</span>
                            </template>

                            <!-- Hover overlay -->
                            <div
                                class="asset-hover-overlay d-flex flex-column align-center justify-center rounded-lg"
                                style="position: absolute; inset: 0; background: rgba(0,0,0,0.55); opacity: 0; transition: opacity 0.18s"
                            >
                                <v-icon color="white" size="24" class="mb-1">mdi-upload-outline</v-icon>
                                <span class="text-caption text-white">Replace</span>
                            </div>
                        </div>

                        <!-- Hidden real file input, triggered by clicking the drop zone -->
                        <v-file-input
                            :ref="(el) => { asset.inputRef.value = el }"
                            :accept="asset.accept"
                            :model-value="asset.file.value"
                            @update:model-value="(f) => asset.onSelect(f)"
                            style="display: none"
                            hide-details
                        />
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- URL Fields -->
        <v-card rounded="lg" border flat class="mb-6">
            <v-card-text class="pa-4">
                <p class="text-subtitle-2 font-weight-semibold mb-4">Public URLs</p>
                <v-row density="comfortable">
                    <v-col cols="12" md="4">
                        <v-text-field
                            v-model="copySettings.application_url"
                            label="Application URL"
                            density="compact"
                            variant="outlined"
                            rounded="md"
                            hide-details="auto"
                            prepend-inner-icon="mdi-web"
                            placeholder="https://app.example.com"
                        />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-text-field
                            v-model="copySettings.imprint_url"
                            label="Imprint URL"
                            density="compact"
                            variant="outlined"
                            rounded="md"
                            hide-details="auto"
                            prepend-inner-icon="mdi-file-document-outline"
                            placeholder="https://example.com/imprint"
                        />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-text-field
                            v-model="copySettings.privacy_url"
                            label="Privacy URL"
                            density="compact"
                            variant="outlined"
                            rounded="md"
                            hide-details="auto"
                            prepend-inner-icon="mdi-shield-outline"
                            placeholder="https://example.com/privacy"
                        />
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Actions Row -->
        <div class="d-flex align-center">
            <v-fade-transition>
                <span v-if="hasChanges" class="text-caption text-medium-emphasis">
                    <v-icon size="14" class="mr-1">mdi-circle-medium</v-icon>
                    Unsaved changes
                </span>
            </v-fade-transition>

            <v-spacer />

            <v-btn
                v-if="hasChanges"
                color="primary"
                rounded="md"
                :loading="saving"
                prepend-icon="mdi-content-save-outline"
                @click="saveSettings"
            >
                Save Changes
            </v-btn>
        </div>

        <!-- Snackbar feedback -->
        <v-snackbar
            v-model="snackbar.show"
            :color="snackbar.color"
            :timeout="3000"
            location="bottom right"
            rounded="md"
        >
            <v-icon class="mr-2">{{ snackbar.icon }}</v-icon>
            {{ snackbar.text }}
        </v-snackbar>

    </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

const pb = usePocketbase()
const { t } = useI18n()

useHead({
    title: t('page.title.settings'),
    meta: [{ name: 'description', content: t('page.content.settings') }],
})

definePageMeta({
    authRequired: true,
    middleware: ['auth'],
})

// ── Data fetching ─────────────────────────────────────────────────────────────

const { data: settings } = await useAsyncData('settings', () =>
    pb.collection('settings').getOne('settings_123456'),
)

// ── State ─────────────────────────────────────────────────────────────────────

const original = reactive({
    application_url: settings.value?.application_url ?? '',
    imprint_url:     settings.value?.imprint_url ?? '',
    privacy_url:     settings.value?.privacy_url ?? '',
})

const copySettings = reactive({ ...original })

const logoFile  = ref(null)
const iconFile  = ref(null)
const signFile  = ref(null)

const logoInputRef  = ref(null)
const iconInputRef  = ref(null)
const signInputRef  = ref(null)

const logoPreview = ref(null)
const iconPreview = ref(null)
const signPreview = ref(null)

const saving = ref(false)
const snackbar = reactive({
    show:  false,
    color: 'success',
    icon:  'mdi-check-circle',
    text:  '',
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function pbFileUrl(rec, filename) {
    if (!filename) return null
    return pb.files.getURL(rec, filename)
}

function notify(text, color = 'success', icon = 'mdi-check-circle') {
    Object.assign(snackbar, { show: true, color, icon, text })
}

// ── Asset field descriptors (drives the template v-for) ───────────────────────

const assetFields = computed(() => [
    {
        key:          'logo',
        label:        'Page Logo',
        accept:       'image/jpeg,image/png,image/svg+xml,image/webp',
        file:         logoFile,
        preview:      logoPreview,
        inputRef:     logoInputRef,
        isDirty:      !!logoFile.value,
        onSelect:     onLogoSelected,
        triggerInput: () => logoInputRef.value?.$el?.querySelector('input')?.click(),
    },
    {
        key:          'icon',
        label:        'Page Icon',
        accept:       '.ico,image/vnd.microsoft.icon,image/x-icon',
        file:         iconFile,
        preview:      iconPreview,
        inputRef:     iconInputRef,
        isDirty:      !!iconFile.value,
        onSelect:     onIconSelected,
        triggerInput: () => iconInputRef.value?.$el?.querySelector('input')?.click(),
    },
    {
        key:          'sign',
        label:        'Sign Image',
        accept:       'image/jpeg,image/png,image/svg+xml,image/webp',
        file:         signFile,
        preview:      signPreview,
        inputRef:     signInputRef,
        isDirty:      !!signFile.value,
        onSelect:     onSignSelected,
        triggerInput: () => signInputRef.value?.$el?.querySelector('input')?.click(),
    },
])

// ── Lifecycle ─────────────────────────────────────────────────────────────────

let unsubscribe = null

onMounted(async () => {
    const rec = settings.value
    logoPreview.value = pbFileUrl(rec, rec.page_logo)
    iconPreview.value = pbFileUrl(rec, rec.page_icon)
    signPreview.value = pbFileUrl(rec, rec.sign_image)

    // subscribe() returns a Promise<unsubscribe fn> in PocketBase JS SDK v0.21+
    unsubscribe = await pb.collection('settings').subscribe(
        'settings_123456',
        (e) => {
            const d = e.record
            logoPreview.value = pbFileUrl(d, d.page_logo)
            iconPreview.value = pbFileUrl(d, d.page_icon)
            signPreview.value = pbFileUrl(d, d.sign_image)

            original.application_url = d.application_url
            original.imprint_url     = d.imprint_url
            original.privacy_url     = d.privacy_url

            Object.assign(copySettings, {
                application_url: d.application_url,
                imprint_url:     d.imprint_url,
                privacy_url:     d.privacy_url,
            })
        },
    )
})

onUnmounted(() => {
    unsubscribe?.()
})

// ── File selection handlers ───────────────────────────────────────────────────

function onLogoSelected(file) {
    logoFile.value    = file
    logoPreview.value = file
        ? URL.createObjectURL(file)
        : pbFileUrl(settings.value, settings.value.page_logo)
}

function onIconSelected(file) {
    iconFile.value    = file
    iconPreview.value = file
        ? URL.createObjectURL(file)
        : pbFileUrl(settings.value, settings.value.page_icon)
}

function onSignSelected(file) {
    signFile.value    = file
    signPreview.value = file
        ? URL.createObjectURL(file)
        : pbFileUrl(settings.value, settings.value.sign_image)
}

// ── Dirty flag ────────────────────────────────────────────────────────────────

const hasChanges = computed(() => {
    if (logoFile.value || iconFile.value || signFile.value) return true
    return (
        copySettings.application_url !== original.application_url ||
        copySettings.imprint_url     !== original.imprint_url     ||
        copySettings.privacy_url     !== original.privacy_url
    )
})

// ── Save ──────────────────────────────────────────────────────────────────────

async function saveSettings() {
    if (!hasChanges.value || saving.value) return
    saving.value = true

    try {
        // PB SDK v0.21+ converts plain objects with File values to multipart automatically
        const payload = {
            application_url: copySettings.application_url,
            imprint_url:     copySettings.imprint_url,
            privacy_url:     copySettings.privacy_url,
        }
        if (logoFile.value) payload.page_logo  = logoFile.value
        if (iconFile.value) payload.page_icon  = iconFile.value
        if (signFile.value) payload.sign_image = signFile.value

        const updated = await pb
            .collection('settings')
            .update(settings.value.id, payload)

        // Sync previews to canonical PB-hosted URLs
        logoPreview.value = pbFileUrl(updated, updated.page_logo)
        iconPreview.value = pbFileUrl(updated, updated.page_icon)
        signPreview.value = pbFileUrl(updated, updated.sign_image)

        // Clear staged file refs
        logoFile.value = iconFile.value = signFile.value = null

        // Advance the original snapshot so hasChanges resets
        original.application_url = updated.application_url
        original.imprint_url     = updated.imprint_url
        original.privacy_url     = updated.privacy_url

        Object.assign(copySettings, {
            application_url: updated.application_url,
            imprint_url:     updated.imprint_url,
            privacy_url:     updated.privacy_url,
        })

        notify('Settings saved successfully.')
    } catch (err) {
        console.error('Save failed:', err)
        notify(
            'Failed to save settings. Please try again.',
            'error',
            'mdi-alert-circle',
        )
    } finally {
        saving.value = false
    }
}
</script>

<style scoped>
.asset-drop-zone:hover .asset-hover-overlay {
    opacity: 1 !important;
}
.asset-drop-zone:hover {
    border-color: rgba(255, 255, 255, 0.3) !important;
}
</style>