<template>
    <v-container>
        <LayoutPageHeader :title="$t('page.content.settings')" />

        <v-alert
            v-if="!mailConfigured"
            type="info"
            variant="tonal"
            icon="mdi-email-off-outline"
            class="mb-4"
            data-testid="settings-mail-warning"
        >
            <div class="d-flex flex-wrap align-center ga-2">
                <span style="flex: 1 1 16rem">{{
                    $t('settings.mailNotConfigured')
                }}</span>
                <v-btn
                    variant="text"
                    size="small"
                    :href="pbMailSettingsUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="settings-mail-warning-link"
                >
                    {{ $t('settings.mailNotConfiguredAction') }}
                </v-btn>
            </div>
        </v-alert>

        <!-- Image Upload Cards -->
        <v-row class="mb-4" density="comfortable">
            <v-col
                v-for="asset in assetFields"
                :key="asset.key"
                cols="12"
                sm="4"
            >
                <v-card
                    border
                    flat
                    height="100%"
                    :class="{ 'border-primary': asset.isDirty }"
                    style="transition: border-color 0.2s"
                >
                    <v-card-text class="pa-4">
                        <div
                            class="d-flex align-center justify-space-between mb-3"
                        >
                            <span class="text-title-small font-weight-semibold">
                                {{ asset.label }}
                            </span>
                            <div class="d-flex align-center ga-1">
                                <v-chip
                                    v-if="asset.isDirty"
                                    color="warning"
                                    size="x-small"
                                    variant="tonal"
                                >
                                    {{ $t('settings.changed') }}
                                </v-chip>
                                <v-btn
                                    v-if="asset.isDirty"
                                    icon
                                    size="x-small"
                                    variant="text"
                                    :aria-label="$t('settings.revertChange')"
                                    :title="$t('settings.revertChange')"
                                    @click.stop="asset.onRevert()"
                                >
                                    <v-icon size="16">mdi-close</v-icon>
                                </v-btn>
                            </div>
                        </div>

                        <!-- Preview + Upload combined area -->
                        <div
                            class="asset-drop-zone d-flex flex-column align-center justify-center rounded-lg position-relative"
                            style="height: 160px"
                            :data-testid="`settings-asset-${asset.key}`"
                            @click="() => asset.triggerInput()"
                        >
                            <!-- Preview image when available -->
                            <img
                                v-if="asset.preview.value"
                                :src="asset.preview.value"
                                :alt="asset.label"
                                style="
                                    max-height: 130px;
                                    max-width: 100%;
                                    object-fit: contain;
                                    display: block;
                                "
                            />

                            <!-- Empty state -->
                            <template v-else>
                                <v-icon
                                    size="28"
                                    class="mb-2 text-medium-emphasis"
                                    >mdi-image-plus-outline</v-icon
                                >
                                <span
                                    class="text-body-small text-medium-emphasis"
                                    >{{ $t('settings.clickToUpload') }}</span
                                >
                            </template>

                            <!-- Hover overlay: replace + optional delete -->
                            <div
                                class="asset-hover-overlay rounded-lg"
                                style="
                                    position: absolute;
                                    inset: 0;
                                    background: rgba(0, 0, 0, 0.55);
                                    opacity: 0;
                                    transition: opacity 0.18s;
                                "
                            >
                                <div
                                    class="d-flex align-center justify-center"
                                    style="height: 100%; gap: 16px"
                                >
                                    <div
                                        class="d-flex flex-column align-center"
                                    >
                                        <v-icon
                                            color="white"
                                            size="24"
                                            class="mb-1"
                                            >mdi-upload-outline</v-icon
                                        >
                                        <span
                                            class="text-body-small text-white"
                                            >{{ $t('settings.replace') }}</span
                                        >
                                    </div>
                                    <div
                                        v-if="
                                            asset.preview.value &&
                                            !asset.isDirty
                                        "
                                        class="d-flex flex-column align-center"
                                        @click.stop="asset.onDelete()"
                                    >
                                        <v-icon
                                            color="error"
                                            size="24"
                                            class="mb-1"
                                            >mdi-delete-outline</v-icon
                                        >
                                        <span
                                            class="text-body-small text-white"
                                            >{{
                                                $t('settings.removeImage')
                                            }}</span
                                        >
                                    </div>
                                </div>
                            </div>
                        </div>

                        <v-file-input
                            :ref="
                                (el) => {
                                    asset.inputRef.value = el
                                }
                            "
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

        <!-- Organization -->
        <v-card border flat class="mb-6">
            <v-card-text class="pa-4">
                <p class="text-title-small font-weight-semibold mb-4">
                    {{ $t('settings.organization') }}
                </p>
                <v-row density="comfortable">
                    <v-col cols="12" md="6">
                        <v-text-field
                            v-model="copySettings.organization_name"
                            :label="$t('settings.organizationName')"
                            density="compact"
                            hide-details="auto"
                            prepend-inner-icon="mdi-domain"
                            :placeholder="
                                $t('settings.organizationNamePlaceholder')
                            "
                            :maxlength="50"
                            counter
                            data-testid="settings-org-name"
                        />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field
                            v-model="copySettings.organization_unit_name"
                            :label="$t('settings.organizationUnit')"
                            density="compact"
                            hide-details="auto"
                            prepend-inner-icon="mdi-office-building-outline"
                            :placeholder="
                                $t('settings.organizationUnitPlaceholder')
                            "
                            :maxlength="50"
                            counter
                            data-testid="settings-org-unit"
                        />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field
                            v-model="copySettings.contact_email"
                            type="email"
                            :label="$t('settings.contactEmail')"
                            :hint="$t('settings.contactEmailHint')"
                            persistent-hint
                            density="compact"
                            prepend-inner-icon="mdi-email-outline"
                            data-testid="settings-contact-email"
                        />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field
                            v-model.number="copySettings.audit_retention_days"
                            type="number"
                            :min="1"
                            :max="3650"
                            :label="$t('settings.auditRetention')"
                            :hint="$t('settings.auditRetentionHint')"
                            persistent-hint
                            density="compact"
                            prepend-inner-icon="mdi-clipboard-text-clock-outline"
                            data-testid="settings-audit-retention"
                        />
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- URL Fields -->
        <v-card border flat class="mb-6">
            <v-card-text class="pa-4">
                <p class="text-title-small font-weight-semibold mb-4">
                    {{ $t('settings.publicUrls') }}
                </p>
                <v-row density="comfortable">
                    <v-col cols="12" md="4">
                        <v-text-field
                            v-model="copySettings.application_url"
                            :label="$t('settings.applicationUrl')"
                            density="compact"
                            hide-details="auto"
                            prepend-inner-icon="mdi-web"
                            placeholder="https://app.example.com"
                            data-testid="settings-application-url"
                        />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-text-field
                            v-model="copySettings.imprint_url"
                            :label="$t('settings.imprintUrl')"
                            density="compact"
                            hide-details="auto"
                            prepend-inner-icon="mdi-file-document-outline"
                            placeholder="https://example.com/imprint"
                            :hint="$t('settings.legalUrlHint')"
                            persistent-hint
                            data-testid="settings-imprint-url"
                        />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-text-field
                            v-model="copySettings.privacy_url"
                            :label="$t('settings.privacyUrl')"
                            density="compact"
                            hide-details="auto"
                            prepend-inner-icon="mdi-shield-outline"
                            placeholder="https://example.com/privacy"
                            :hint="$t('settings.legalUrlHint')"
                            persistent-hint
                            data-testid="settings-privacy-url"
                        />
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <v-card border flat class="mb-6">
            <v-card-text class="pa-4">
                <p class="text-title-small font-weight-semibold mb-1">
                    {{ $t('settings.legalTitle') }}
                </p>
                <p class="text-body-small text-medium-emphasis mb-4">
                    {{ $t('settings.legalIntro') }}
                </p>
                <v-row density="comfortable">
                    <v-col cols="12">
                        <v-textarea
                            v-model="copySettings.legal_address"
                            :label="$t('settings.legalAddress')"
                            :placeholder="
                                $t('settings.legalAddressPlaceholder')
                            "
                            density="compact"
                            rows="3"
                            auto-grow
                            hide-details="auto"
                            prepend-inner-icon="mdi-map-marker-outline"
                            data-testid="settings-legal-address"
                        />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-text-field
                            v-model="copySettings.legal_phone"
                            :label="$t('settings.legalPhone')"
                            density="compact"
                            hide-details="auto"
                            type="tel"
                            prepend-inner-icon="mdi-phone-outline"
                            data-testid="settings-legal-phone"
                        />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-text-field
                            v-model="copySettings.legal_register"
                            :label="$t('settings.legalRegister')"
                            :placeholder="
                                $t('settings.legalRegisterPlaceholder')
                            "
                            density="compact"
                            hide-details="auto"
                            prepend-inner-icon="mdi-file-certificate-outline"
                            data-testid="settings-legal-register"
                        />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-text-field
                            v-model="copySettings.legal_vat_id"
                            :label="$t('settings.legalVatId')"
                            placeholder="DE123456789"
                            density="compact"
                            hide-details="auto"
                            prepend-inner-icon="mdi-cash-register"
                            data-testid="settings-legal-vat-id"
                        />
                    </v-col>
                    <v-col cols="12">
                        <v-text-field
                            v-model="copySettings.legal_editorial"
                            :label="$t('settings.legalEditorial')"
                            :hint="$t('settings.legalEditorialHint')"
                            persistent-hint
                            density="compact"
                            prepend-inner-icon="mdi-pencil-outline"
                            data-testid="settings-legal-editorial"
                        />
                    </v-col>
                </v-row>

                <p class="text-title-small font-weight-semibold mt-6 mb-3">
                    {{ $t('settings.legalRepresentatives') }}
                </p>
                <div class="person-list">
                    <div
                        v-for="(
                            person, index
                        ) in copySettings.legal_representatives"
                        :key="index"
                        class="person-row"
                        data-testid="settings-legal-representative"
                    >
                        <v-text-field
                            v-model="person.name"
                            :label="$t('settings.legalPersonName')"
                            density="compact"
                            hide-details="auto"
                            prepend-inner-icon="mdi-account-outline"
                            data-testid="settings-legal-representative-name"
                        />
                        <v-text-field
                            v-model="person.role"
                            :label="$t('settings.legalPersonRole')"
                            :placeholder="
                                $t('settings.legalPersonRolePlaceholder')
                            "
                            density="compact"
                            hide-details="auto"
                            prepend-inner-icon="mdi-badge-account-outline"
                            data-testid="settings-legal-representative-role"
                        />
                        <v-btn
                            icon="mdi-delete-outline"
                            variant="text"
                            color="error"
                            density="comfortable"
                            :aria-label="$t('settings.legalRemovePerson')"
                            :title="$t('settings.legalRemovePerson')"
                            data-testid="settings-legal-remove-representative"
                            @click="
                                copySettings.legal_representatives.splice(
                                    index,
                                    1,
                                )
                            "
                        />
                    </div>
                </div>
                <v-btn
                    variant="tonal"
                    size="small"
                    prepend-icon="mdi-account-plus-outline"
                    class="mt-3"
                    data-testid="settings-legal-add-representative"
                    @click="
                        copySettings.legal_representatives.push({
                            name: '',
                            role: '',
                        })
                    "
                >
                    {{ $t('settings.legalAddPerson') }}
                </v-btn>
            </v-card-text>
        </v-card>

        <!-- Actions Row -->
        <div class="d-flex align-center">
            <v-fade-transition>
                <span
                    v-if="hasChanges"
                    class="text-body-small text-medium-emphasis"
                >
                    <v-icon size="14" class="mr-1">mdi-circle-medium</v-icon>
                    {{ $t('account.unsavedChanges') }}
                </span>
            </v-fade-transition>

            <v-spacer />

            <v-btn
                v-if="hasChanges"
                color="primary"
                :loading="saving"
                prepend-icon="mdi-content-save-outline"
                data-testid="settings-save"
                @click="saveSettings"
            >
                {{ $t('actions.save') }}
            </v-btn>
        </div>
    </v-container>
</template>

<script setup>
const pb = usePocketbase()
const { t } = useI18n()

useHead({
    title: t('page.title.settings'),
    meta: [{ name: 'description', content: t('page.content.settings') }],
})

definePageMeta({
    middleware: ['auth'],
    requiredPermission: 'manage_settings',
})

// ── Data fetching ─────────────────────────────────────────────────────────────

const { data: settings } = useNuxtData('settings')

const { data: mailStatus } = useMailStatus()
const pbMailSettingsUrl =
    (import.meta.dev ? 'http://localhost:8090' : '') + '/_/#/settings/mail'
const mailConfigured = computed(() => mailStatus.value?.configured !== false)

// ── State ─────────────────────────────────────────────────────────────────────

const original = reactive({
    application_url: '',
    imprint_url: '',
    privacy_url: '',
    organization_name: '',
    organization_unit_name: '',
    contact_email: '',
    audit_retention_days: 90,
    ...legalFieldsFrom({}),
})

const copySettings = reactive({ ...original, ...legalFieldsFrom(original) })

function legalFieldsFrom(rec) {
    return {
        legal_address: rec.legal_address ?? '',
        legal_phone: rec.legal_phone ?? '',
        legal_register: rec.legal_register ?? '',
        legal_vat_id: rec.legal_vat_id ?? '',
        legal_editorial: rec.legal_editorial ?? '',
        legal_representatives: (rec.legal_representatives ?? []).map(
            (person) => ({ name: person.name ?? '', role: person.role ?? '' }),
        ),
    }
}

function legalPayload(state) {
    const fields = legalFieldsFrom(state)
    fields.legal_representatives = fields.legal_representatives
        .map((person) => ({
            name: person.name.trim(),
            role: person.role.trim(),
        }))
        .filter((person) => person.name)
    return fields
}

function adoptRecord(rec) {
    if (!rec) return
    const dirty = hasChanges.value
    original.application_url = rec.application_url ?? ''
    original.imprint_url = rec.imprint_url ?? ''
    original.privacy_url = rec.privacy_url ?? ''
    original.organization_name = rec.organization_name ?? ''
    original.organization_unit_name = rec.organization_unit_name ?? ''
    original.contact_email = rec.contact_email ?? ''
    original.audit_retention_days = rec.audit_retention_days ?? 90
    Object.assign(original, legalFieldsFrom(rec))
    if (!dirty) Object.assign(copySettings, original, legalFieldsFrom(original))

    logoPreview.value = pbFileUrl(rec, rec.page_logo)
    iconPreview.value = pbFileUrl(rec, rec.page_icon)
    signPreview.value = pbFileUrl(rec, rec.sign_image)
}

const logoFile = ref(null)
const iconFile = ref(null)
const signFile = ref(null)

const logoClear = ref(false)
const iconClear = ref(false)
const signClear = ref(false)

const logoInputRef = ref(null)
const iconInputRef = ref(null)
const signInputRef = ref(null)

const logoPreview = ref(null)
const iconPreview = ref(null)
const signPreview = ref(null)

const saving = ref(false)
const { notify, error: notifyError } = useNotification()

// ── Helpers ───────────────────────────────────────────────────────────────────

function pbFileUrl(rec, filename) {
    return usePbFileUrl(rec, filename) || null
}

// ── Asset field descriptors (drives the template v-for) ───────────────────────

const assetFields = computed(() => [
    {
        key: 'logo',
        label: 'Page Logo',
        accept: 'image/jpeg,image/png,image/svg+xml,image/webp',
        file: logoFile,
        preview: logoPreview,
        inputRef: logoInputRef,
        isDirty: !!logoFile.value || logoClear.value,
        onSelect: onLogoSelected,
        onRevert: onLogoRevert,
        onDelete: onLogoDelete,
        triggerInput: () =>
            logoInputRef.value?.$el?.querySelector('input')?.click(),
    },
    {
        key: 'icon',
        label: 'Page Icon',
        accept: '.ico,image/vnd.microsoft.icon,image/x-icon',
        file: iconFile,
        preview: iconPreview,
        inputRef: iconInputRef,
        isDirty: !!iconFile.value || iconClear.value,
        onSelect: onIconSelected,
        onRevert: onIconRevert,
        onDelete: onIconDelete,
        triggerInput: () =>
            iconInputRef.value?.$el?.querySelector('input')?.click(),
    },
    {
        key: 'sign',
        label: 'Sign Image',
        accept: 'image/jpeg,image/png,image/svg+xml,image/webp',
        file: signFile,
        preview: signPreview,
        inputRef: signInputRef,
        isDirty: !!signFile.value || signClear.value,
        onSelect: onSignSelected,
        onRevert: onSignRevert,
        onDelete: onSignDelete,
        triggerInput: () =>
            signInputRef.value?.$el?.querySelector('input')?.click(),
    },
])

// ── Lifecycle ─────────────────────────────────────────────────────────────────

let unsubscribe = null

onMounted(async () => {
    unsubscribe = await pb
        .collection('settings')
        .subscribe('settings_123456', (e) => adoptRecord(e.record))
})

onUnmounted(() => {
    unsubscribe?.()
})

// ── File selection handlers ───────────────────────────────────────────────────

function onLogoSelected(file) {
    logoFile.value = file
    logoClear.value = false
    logoPreview.value = file
        ? URL.createObjectURL(file)
        : pbFileUrl(settings.value, settings.value.page_logo)
}

function onIconSelected(file) {
    iconFile.value = file
    iconClear.value = false
    iconPreview.value = file
        ? URL.createObjectURL(file)
        : pbFileUrl(settings.value, settings.value.page_icon)
}

function onSignSelected(file) {
    signFile.value = file
    signClear.value = false
    signPreview.value = file
        ? URL.createObjectURL(file)
        : pbFileUrl(settings.value, settings.value.sign_image)
}

function onLogoRevert() {
    logoFile.value = null
    logoClear.value = false
    logoPreview.value = pbFileUrl(settings.value, settings.value.page_logo)
}
function onLogoDelete() {
    logoClear.value = true
    logoPreview.value = null
}

function onIconRevert() {
    iconFile.value = null
    iconClear.value = false
    iconPreview.value = pbFileUrl(settings.value, settings.value.page_icon)
}
function onIconDelete() {
    iconClear.value = true
    iconPreview.value = null
}

function onSignRevert() {
    signFile.value = null
    signClear.value = false
    signPreview.value = pbFileUrl(settings.value, settings.value.sign_image)
}
function onSignDelete() {
    signClear.value = true
    signPreview.value = null
}

// ── Dirty flag ────────────────────────────────────────────────────────────────

const hasChanges = computed(() => {
    if (logoFile.value || iconFile.value || signFile.value) return true
    if (logoClear.value || iconClear.value || signClear.value) return true
    return (
        copySettings.application_url !== original.application_url ||
        copySettings.imprint_url !== original.imprint_url ||
        copySettings.privacy_url !== original.privacy_url ||
        copySettings.organization_name !== original.organization_name ||
        copySettings.organization_unit_name !==
            original.organization_unit_name ||
        copySettings.contact_email !== original.contact_email ||
        copySettings.audit_retention_days !== original.audit_retention_days ||
        JSON.stringify(legalFieldsFrom(copySettings)) !==
            JSON.stringify(legalFieldsFrom(original))
    )
})

watch(settings, adoptRecord, { immediate: true })

// ── Save ──────────────────────────────────────────────────────────────────────

async function saveSettings() {
    if (!hasChanges.value || saving.value) return
    saving.value = true

    try {
        const payload = {
            application_url: copySettings.application_url,
            imprint_url: copySettings.imprint_url,
            privacy_url: copySettings.privacy_url,
            organization_name: copySettings.organization_name,
            organization_unit_name: copySettings.organization_unit_name,
            contact_email: copySettings.contact_email,
            audit_retention_days:
                Number(copySettings.audit_retention_days) || null,
            ...legalPayload(copySettings),
        }
        if (logoFile.value) payload.page_logo = logoFile.value
        else if (logoClear.value) payload.page_logo = null
        if (iconFile.value) payload.page_icon = iconFile.value
        else if (iconClear.value) payload.page_icon = null
        if (signFile.value) payload.sign_image = signFile.value
        else if (signClear.value) payload.sign_image = null

        const updated = await pb
            .collection('settings')
            .update(settings.value.id, payload)

        logoPreview.value = pbFileUrl(updated, updated.page_logo)
        iconPreview.value = pbFileUrl(updated, updated.page_icon)
        signPreview.value = pbFileUrl(updated, updated.sign_image)

        logoFile.value = iconFile.value = signFile.value = null
        logoClear.value = iconClear.value = signClear.value = false

        original.application_url = updated.application_url
        original.imprint_url = updated.imprint_url
        original.privacy_url = updated.privacy_url
        original.organization_name = updated.organization_name
        original.organization_unit_name = updated.organization_unit_name
        original.contact_email = updated.contact_email ?? ''
        original.audit_retention_days = updated.audit_retention_days ?? 90
        Object.assign(original, legalFieldsFrom(updated))

        Object.assign(copySettings, {
            application_url: updated.application_url,
            imprint_url: updated.imprint_url,
            privacy_url: updated.privacy_url,
            organization_name: updated.organization_name,
            organization_unit_name: updated.organization_unit_name,
            contact_email: updated.contact_email ?? '',
            audit_retention_days: updated.audit_retention_days ?? 90,
            ...legalFieldsFrom(updated),
        })

        notify(t('settings.saveSuccess'))
    } catch (err) {
        console.error('Save failed:', err)
        notifyError(t('settings.saveError'))
    } finally {
        saving.value = false
    }
}
</script>

<style scoped>
.person-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.person-row {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 12px;
    align-items: center;
}

@media (max-width: 599px) {
    .person-list {
        gap: 24px;
    }

    .person-row {
        grid-template-columns: 1fr auto;
    }

    .person-row > :nth-child(2) {
        grid-row: 2;
    }
}

.asset-drop-zone {
    border: 1.5px dashed rgba(var(--v-border-color), 0.28);
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.18s;
}
.asset-drop-zone:hover {
    border-color: rgba(var(--v-border-color), 0.6);
}
.asset-drop-zone:hover .asset-hover-overlay {
    opacity: 1 !important;
}
</style>
