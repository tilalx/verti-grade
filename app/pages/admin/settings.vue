<template>
    <div class="w-full p-4" :class="{ 'max-lg:pb-24': hasChanges }">
        <LayoutPageHeader
            :title="$t('page.content.settings')"
            :subtitle="$t('settings.description')"
        />

        <UAlert
            v-if="!mailConfigured"
            color="info"
            variant="soft"
            icon="i-lucide-mail-x"
            class="mb-4"
            data-testid="settings-mail-warning"
        >
            <template #description>
                <div class="flex flex-wrap items-center gap-2">
                    <span class="alert-message">{{
                        $t('settings.mailNotConfigured')
                    }}</span>
                    <UButton
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        :href="pbMailSettingsUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="settings-mail-warning-link"
                    >
                        {{ $t('settings.mailNotConfiguredAction') }}
                    </UButton>
                </div>
            </template>
        </UAlert>

        <nav
            class="settings-nav-mobile lg:hidden"
            :aria-label="$t('settings.sections')"
        >
            <UNavigationMenu
                :items="sectionNavItems"
                highlight
                class="w-max min-w-full"
            />
        </nav>

        <div class="flex gap-8">
            <aside class="hidden w-52 shrink-0 lg:block">
                <nav
                    class="settings-nav-desktop"
                    :aria-label="$t('settings.sections')"
                >
                    <UNavigationMenu
                        :items="sectionNavItems"
                        orientation="vertical"
                        highlight
                    />
                </nav>
            </aside>

            <div class="min-w-0 flex-1">
                <LayoutSaveBar
                    :show="hasChanges"
                    :loading="saving"
                    :disabled="retentionError !== false"
                    test-id-prefix="settings"
                    @save="saveSettings"
                />

                <div class="flex flex-col gap-6">
                    <UPageCard
                        v-if="activeSection === 'branding'"
                        id="settings-branding"
                        :title="$t('settings.branding')"
                        :description="$t('settings.brandingHint')"
                        variant="subtle"
                    >
                        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            <article
                                v-for="asset in assetFields"
                                :key="asset.key"
                                class="asset-card"
                                :class="{ 'asset-card--dirty': asset.isDirty }"
                            >
                                <button
                                    type="button"
                                    class="asset-card__preview"
                                    :class="{
                                        'asset-card__preview--empty':
                                            !asset.preview.value,
                                    }"
                                    :data-testid="`settings-asset-${asset.key}`"
                                    :aria-label="`${asset.label}: ${asset.preview.value ? $t('settings.replace') : $t('settings.clickToUpload')}`"
                                    @click="asset.triggerInput()"
                                >
                                    <img
                                        v-if="asset.preview.value"
                                        :src="asset.preview.value"
                                        :alt="asset.label"
                                        class="asset-card__image"
                                        :class="{
                                            'asset-card__image--mono':
                                                asset.key === 'logo',
                                        }"
                                    />
                                    <span
                                        v-else
                                        class="flex flex-col items-center gap-2 text-sm text-muted"
                                    >
                                        <UIcon
                                            name="i-lucide-image-plus"
                                            class="size-8"
                                        />
                                        {{ $t('settings.clickToUpload') }}
                                    </span>
                                </button>

                                <div class="flex flex-1 flex-col gap-1 p-4">
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="font-semibold text-highlighted"
                                            :data-testid="`settings-asset-label-${asset.key}`"
                                            >{{ asset.label }}</span
                                        >
                                        <UBadge
                                            v-if="asset.isDirty"
                                            color="warning"
                                            size="sm"
                                            variant="soft"
                                        >
                                            {{ $t('settings.changed') }}
                                        </UBadge>
                                    </div>
                                    <p class="text-sm text-muted">
                                        {{ asset.hint }}
                                    </p>

                                    <div
                                        class="mt-auto flex flex-wrap items-center gap-2 pt-3"
                                    >
                                        <div
                                            v-if="asset.preview.value"
                                            class="flex flex-wrap gap-2"
                                            :data-testid="`settings-asset-actions-${asset.key}`"
                                        >
                                            <UButton
                                                color="neutral"
                                                variant="outline"
                                                size="sm"
                                                icon="i-lucide-image-up"
                                                :data-testid="`settings-asset-replace-${asset.key}`"
                                                @click="asset.triggerInput()"
                                            >
                                                {{ $t('settings.replace') }}
                                            </UButton>
                                            <UButton
                                                v-if="!asset.isDirty"
                                                color="error"
                                                variant="ghost"
                                                size="sm"
                                                icon="i-lucide-trash-2"
                                                :data-testid="`settings-asset-delete-${asset.key}`"
                                                @click="asset.onDelete()"
                                            >
                                                {{ $t('settings.removeImage') }}
                                            </UButton>
                                        </div>
                                        <UButton
                                            v-else
                                            color="neutral"
                                            variant="outline"
                                            size="sm"
                                            icon="i-lucide-upload"
                                            @click="asset.triggerInput()"
                                        >
                                            {{ $t('settings.clickToUpload') }}
                                        </UButton>
                                        <UButton
                                            v-if="asset.isDirty"
                                            color="neutral"
                                            variant="ghost"
                                            size="sm"
                                            icon="i-lucide-undo-2"
                                            @click="asset.onRevert()"
                                        >
                                            {{ $t('settings.revertChange') }}
                                        </UButton>
                                    </div>
                                </div>

                                <input
                                    :ref="
                                        (el) => {
                                            asset.inputRef.value =
                                                el as HTMLInputElement | null
                                        }
                                    "
                                    type="file"
                                    :accept="asset.accept"
                                    class="hidden"
                                    @change="
                                        onFileChange($event, asset.onSelect)
                                    "
                                />
                            </article>
                        </div>
                    </UPageCard>

                    <UPageCard
                        v-if="activeSection === 'organization'"
                        id="settings-organization"
                        :ui="formCardUi"
                        :title="$t('settings.organization')"
                        :description="$t('settings.organizationHint')"
                        variant="subtle"
                    >
                        <UFormField
                            :label="$t('settings.organizationName')"
                            :ui="fieldUi"
                        >
                            <UInput
                                v-model="copySettings.organization_name"
                                icon="i-lucide-building-2"
                                :placeholder="
                                    $t('settings.organizationNamePlaceholder')
                                "
                                :maxlength="50"
                                class="w-full"
                                data-testid="settings-org-name"
                            />
                        </UFormField>
                        <UFormField
                            :label="$t('settings.organizationUnit')"
                            :ui="fieldUi"
                        >
                            <UInput
                                v-model="copySettings.organization_unit_name"
                                icon="i-lucide-building-2"
                                :placeholder="
                                    $t('settings.organizationUnitPlaceholder')
                                "
                                :maxlength="50"
                                class="w-full"
                                data-testid="settings-org-unit"
                            />
                        </UFormField>
                        <UFormField
                            :label="$t('settings.contactEmail')"
                            :description="$t('settings.contactEmailHint')"
                            :ui="fieldUi"
                        >
                            <UInput
                                v-model="copySettings.contact_email"
                                type="email"
                                icon="i-lucide-mail"
                                class="w-full"
                                data-testid="settings-contact-email"
                            />
                        </UFormField>
                        <UFormField
                            :label="$t('settings.auditRetention')"
                            :description="$t('settings.auditRetentionHint')"
                            :error="retentionError"
                            :ui="fieldUi"
                        >
                            <UInput
                                v-model.number="
                                    copySettings.audit_retention_days
                                "
                                type="number"
                                :min="1"
                                :max="3650"
                                icon="i-lucide-clipboard-clock"
                                class="w-full"
                                data-testid="settings-audit-retention"
                            />
                        </UFormField>
                        <UFormField
                            :label="$t('settings.allowRegistration')"
                            :description="$t('settings.allowRegistrationHint')"
                            :ui="fieldUi"
                        >
                            <USwitch
                                v-model="copySettings.allow_registration"
                                :aria-label="$t('settings.allowRegistration')"
                                data-testid="settings-allow-registration"
                            />
                        </UFormField>
                    </UPageCard>

                    <AdminLocationsCard
                        v-if="activeSection === 'locations'"
                        id="settings-locations-section"
                    />

                    <UPageCard
                        v-if="activeSection === 'grading'"
                        id="settings-grading"
                        :title="$t('settings.grading')"
                        :description="$t('settings.gradingHint')"
                        variant="subtle"
                        :ui="{ ...formCardUi, footer: 'pt-2 lg:col-span-2' }"
                    >
                        <template #footer>
                            <GradeConversionDialog />
                        </template>
                        <UFormField
                            :label="$t('settings.routeGradeSystem')"
                            :ui="fieldUi"
                        >
                            <USelect
                                v-model="copySettings.route_grade_system"
                                :items="gradeSystemItems(ROUTE_GRADE_SYSTEMS)"
                                icon="i-lucide-trending-up"
                                class="w-full"
                                data-testid="settings-route-grade-system"
                            />
                        </UFormField>
                        <UFormField
                            :label="$t('settings.boulderGradeSystem')"
                            :ui="fieldUi"
                        >
                            <USelect
                                v-model="copySettings.boulder_grade_system"
                                :items="gradeSystemItems(BOULDER_GRADE_SYSTEMS)"
                                icon="i-lucide-box"
                                class="w-full"
                                data-testid="settings-boulder-grade-system"
                            />
                        </UFormField>
                        <UFormField
                            :label="$t('settings.boulderBands')"
                            :description="$t('settings.boulderBandsHint')"
                            :ui="fieldUi"
                            class="lg:col-span-2"
                        >
                            <AdminBoulderBandEditor
                                v-model="copySettings.boulder_bands"
                            />
                            <div class="mt-3 flex flex-wrap gap-2">
                                <UButton
                                    color="neutral"
                                    variant="ghost"
                                    size="sm"
                                    icon="i-lucide-rotate-ccw"
                                    data-testid="settings-boulder-band-reset"
                                    @click="
                                        copySettings.boulder_bands =
                                            defaultBandSettings()
                                    "
                                >
                                    {{ $t('settings.resetBands') }}
                                </UButton>
                            </div>
                        </UFormField>
                    </UPageCard>

                    <UPageCard
                        v-if="activeSection === 'urls'"
                        id="settings-urls"
                        :ui="formCardUi"
                        :title="$t('settings.publicUrls')"
                        :description="$t('settings.publicUrlsHint')"
                        variant="subtle"
                    >
                        <UFormField
                            :label="$t('settings.applicationUrl')"
                            :ui="fieldUi"
                        >
                            <UInput
                                v-model="copySettings.application_url"
                                icon="i-lucide-globe"
                                placeholder="https://app.example.com"
                                class="w-full"
                                data-testid="settings-application-url"
                            />
                        </UFormField>
                        <UFormField
                            :label="$t('settings.imprintUrl')"
                            :description="$t('settings.legalUrlHint')"
                            :ui="fieldUi"
                        >
                            <UInput
                                v-model="copySettings.imprint_url"
                                icon="i-lucide-file-text"
                                placeholder="https://example.com/imprint"
                                class="w-full"
                                data-testid="settings-imprint-url"
                            />
                        </UFormField>
                        <UFormField
                            :label="$t('settings.privacyUrl')"
                            :description="$t('settings.legalUrlHint')"
                            :ui="fieldUi"
                        >
                            <UInput
                                v-model="copySettings.privacy_url"
                                icon="i-lucide-shield"
                                placeholder="https://example.com/privacy"
                                class="w-full"
                                data-testid="settings-privacy-url"
                            />
                        </UFormField>
                    </UPageCard>

                    <UPageCard
                        v-if="activeSection === 'legal'"
                        id="settings-legal"
                        :ui="formCardUi"
                        :title="$t('settings.legalTitle')"
                        :description="$t('settings.legalIntro')"
                        variant="subtle"
                    >
                        <UFormField
                            :label="$t('settings.legalAddress')"
                            :ui="fieldUi"
                        >
                            <UTextarea
                                v-model="copySettings.legal_address"
                                :placeholder="
                                    $t('settings.legalAddressPlaceholder')
                                "
                                :rows="3"
                                autoresize
                                icon="i-lucide-map-pin"
                                class="w-full"
                                data-testid="settings-legal-address"
                            />
                        </UFormField>
                        <UFormField
                            :label="$t('settings.legalPhone')"
                            :ui="fieldUi"
                        >
                            <UInput
                                v-model="copySettings.legal_phone"
                                type="tel"
                                icon="i-lucide-phone"
                                class="w-full"
                                data-testid="settings-legal-phone"
                            />
                        </UFormField>
                        <UFormField
                            :label="$t('settings.legalRegister')"
                            :ui="fieldUi"
                        >
                            <UInput
                                v-model="copySettings.legal_register"
                                :placeholder="
                                    $t('settings.legalRegisterPlaceholder')
                                "
                                icon="i-lucide-file-badge"
                                class="w-full"
                                data-testid="settings-legal-register"
                            />
                        </UFormField>
                        <UFormField
                            :label="$t('settings.legalVatId')"
                            :ui="fieldUi"
                        >
                            <UInput
                                v-model="copySettings.legal_vat_id"
                                placeholder="DE123456789"
                                icon="i-lucide-receipt"
                                class="w-full"
                                data-testid="settings-legal-vat-id"
                            />
                        </UFormField>
                        <UFormField
                            :label="$t('settings.legalEditorial')"
                            :description="$t('settings.legalEditorialHint')"
                            :ui="fieldUi"
                        >
                            <UInput
                                v-model="copySettings.legal_editorial"
                                icon="i-lucide-pencil"
                                class="w-full"
                                data-testid="settings-legal-editorial"
                            />
                        </UFormField>
                        <UFormField
                            :label="$t('settings.legalRepresentatives')"
                            :ui="fieldUi"
                            class="lg:col-span-2"
                        >
                            <div class="person-list">
                                <div
                                    v-for="(
                                        person, index
                                    ) in copySettings.legal_representatives"
                                    :key="index"
                                    class="person-row"
                                    data-testid="settings-legal-representative"
                                >
                                    <UFormField
                                        :label="$t('settings.legalPersonName')"
                                    >
                                        <UInput
                                            v-model="person.name"
                                            icon="i-lucide-user"
                                            class="w-full"
                                            data-testid="settings-legal-representative-name"
                                        />
                                    </UFormField>
                                    <UFormField
                                        :label="$t('settings.legalPersonRole')"
                                    >
                                        <UInput
                                            v-model="person.role"
                                            :placeholder="
                                                $t(
                                                    'settings.legalPersonRolePlaceholder',
                                                )
                                            "
                                            icon="i-lucide-id-card"
                                            class="w-full"
                                            data-testid="settings-legal-representative-role"
                                        />
                                    </UFormField>
                                    <UButton
                                        icon="i-lucide-trash-2"
                                        variant="ghost"
                                        color="error"
                                        class="self-end"
                                        :aria-label="
                                            $t('settings.legalRemovePerson')
                                        "
                                        :title="
                                            $t('settings.legalRemovePerson')
                                        "
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
                            <UButton
                                color="neutral"
                                variant="soft"
                                size="sm"
                                icon="i-lucide-user-plus"
                                :class="{
                                    'mt-3': copySettings.legal_representatives
                                        .length,
                                }"
                                data-testid="settings-legal-add-representative"
                                @click="
                                    copySettings.legal_representatives.push({
                                        name: '',
                                        role: '',
                                    })
                                "
                            >
                                {{ $t('settings.legalAddPerson') }}
                            </UButton>
                        </UFormField>
                    </UPageCard>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { UnsubscribeFunc } from 'pocketbase'
import type { SettingsRecord } from '~/types/models'
import {
    DEFAULT_GYM_BANDS,
    bandSettingsFrom,
    type BoulderBandSetting,
} from '#shared/utils/gradeReference'
import { integerBetween } from '~/utils/validation'
import {
    BOULDER_GRADE_SYSTEMS,
    DEFAULT_BOULDER_GRADE_SYSTEM,
    DEFAULT_ROUTE_GRADE_SYSTEM,
    ROUTE_GRADE_SYSTEMS,
    type GradeSystem,
} from '#shared/utils/grades'

type FileInputRef = HTMLInputElement | null

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

const { data: settings } = useNuxtData<SettingsRecord>('settings')

const { data: mailStatus } = useMailStatus()
const pbMailSettingsUrl =
    (import.meta.dev ? 'http://localhost:8090' : '') + '/_/#/settings/mail'
const mailConfigured = computed(() => mailStatus.value?.configured !== false)

const original = reactive({
    application_url: '',
    imprint_url: '',
    privacy_url: '',
    organization_name: '',
    organization_unit_name: '',
    contact_email: '',
    audit_retention_days: 90 as number | null,
    allow_registration: false,
    route_grade_system: DEFAULT_ROUTE_GRADE_SYSTEM as string,
    boulder_grade_system: DEFAULT_BOULDER_GRADE_SYSTEM as string,
    ...legalFieldsFrom({}),
    ...bandFieldsFrom({}),
})

function gradeSystemItems(systems: GradeSystem[]) {
    return systems.map((value) => ({
        label: t(`gradeSystems.${value}`),
        value: value as string,
    }))
}

const copySettings = reactive({
    ...original,
    ...legalFieldsFrom(original),
    ...bandFieldsFrom(original),
})

function defaultBandSettings(): BoulderBandSetting[] {
    return bandSettingsFrom(DEFAULT_GYM_BANDS, (band) =>
        t(`gradeConversion.bands.${band.key}`),
    )
}

function bandFieldsFrom(rec: Partial<SettingsRecord>) {
    return {
        boulder_bands: rec.boulder_bands?.length
            ? rec.boulder_bands.map((band) => ({ ...band }))
            : defaultBandSettings(),
    }
}

function legalFieldsFrom(rec: Partial<SettingsRecord>) {
    return {
        legal_address: rec.legal_address ?? '',
        legal_phone: rec.legal_phone ?? '',
        legal_register: rec.legal_register ?? '',
        legal_vat_id: rec.legal_vat_id ?? '',
        legal_editorial: rec.legal_editorial ?? '',
        legal_representatives: (rec.legal_representatives ?? []).map(
            (person) => ({
                name: person.name ?? '',
                role: person.role ?? '',
            }),
        ),
    }
}

function legalPayload(state: Partial<SettingsRecord>) {
    const fields = legalFieldsFrom(state)
    fields.legal_representatives = fields.legal_representatives
        .map((person) => ({
            name: person.name.trim(),
            role: person.role.trim(),
        }))
        .filter((person) => person.name)
    return fields
}

type EditableSettings = typeof original
type EditableField = keyof EditableSettings

function sameValue(left: unknown, right: unknown) {
    return JSON.stringify(left) === JSON.stringify(right)
}

function untouchedFields() {
    return (Object.keys(original) as EditableField[]).filter((field) =>
        sameValue(copySettings[field], original[field]),
    )
}

function fieldsPayload(state: EditableSettings) {
    return {
        application_url: state.application_url,
        imprint_url: state.imprint_url,
        privacy_url: state.privacy_url,
        organization_name: state.organization_name,
        organization_unit_name: state.organization_unit_name,
        contact_email: state.contact_email,
        audit_retention_days: Number(state.audit_retention_days) || null,
        allow_registration: state.allow_registration,
        route_grade_system: state.route_grade_system,
        boulder_grade_system: state.boulder_grade_system,
        ...legalPayload(state),
        boulder_bands: state.boulder_bands.map((band) => ({
            ...band,
            name: band.name.trim(),
        })),
    }
}

function changedFieldsPayload(): Record<string, unknown> {
    const baseline: Record<string, unknown> = fieldsPayload(original)
    return Object.fromEntries(
        Object.entries(fieldsPayload(copySettings)).filter(
            ([field, value]) => !sameValue(value, baseline[field]),
        ),
    )
}

function adoptRecord(rec: SettingsRecord | null | undefined) {
    if (!rec) return
    const untouched = untouchedFields()
    original.application_url = rec.application_url ?? ''
    original.imprint_url = rec.imprint_url ?? ''
    original.privacy_url = rec.privacy_url ?? ''
    original.organization_name = rec.organization_name ?? ''
    original.organization_unit_name = rec.organization_unit_name ?? ''
    original.contact_email = rec.contact_email ?? ''
    original.audit_retention_days = rec.audit_retention_days ?? 90
    original.allow_registration = !!rec.allow_registration
    original.route_grade_system =
        rec.route_grade_system || DEFAULT_ROUTE_GRADE_SYSTEM
    original.boulder_grade_system =
        rec.boulder_grade_system || DEFAULT_BOULDER_GRADE_SYSTEM
    Object.assign(original, legalFieldsFrom(rec), bandFieldsFrom(rec))
    const fresh = {
        ...original,
        ...legalFieldsFrom(original),
        ...bandFieldsFrom(original),
    }
    for (const field of untouched) {
        Object.assign(copySettings, { [field]: fresh[field] })
    }

    logoPreview.value = pbFileUrl(rec, rec.page_logo)
    iconPreview.value = pbFileUrl(rec, rec.page_icon)
    signPreview.value = pbFileUrl(rec, rec.sign_image)
}

const logoFile = ref<File | null>(null)
const iconFile = ref<File | null>(null)
const signFile = ref<File | null>(null)

const logoClear = ref(false)
const iconClear = ref(false)
const signClear = ref(false)

const logoInputRef = ref<FileInputRef>(null)
const iconInputRef = ref<FileInputRef>(null)
const signInputRef = ref<FileInputRef>(null)

const logoPreview = ref<string | null>(null)
const iconPreview = ref<string | null>(null)
const signPreview = ref<string | null>(null)

const { pending: saving, run: runSave } = useAsyncAction()
const retentionRule = integerBetween(t, 1, 3650)
const retentionError = computed(() => {
    const result = retentionRule(copySettings.audit_retention_days)
    return result === true ? false : result
})

function pbFileUrl(
    rec: Partial<SettingsRecord> | null | undefined,
    filename: string | null | undefined,
) {
    return usePbFileUrl(rec, filename) || null
}

function onFileChange(event: Event, onSelect: (file: File | null) => void) {
    const input = event.target as HTMLInputElement
    onSelect(input.files?.[0] ?? null)
    input.value = ''
}

const assetFields = computed(() => [
    {
        key: 'logo',
        label: t('settings.assets.logo'),
        hint: t('settings.assetHints.logo'),
        accept: 'image/jpeg,image/png,image/svg+xml,image/webp',
        preview: logoPreview,
        inputRef: logoInputRef,
        isDirty: !!logoFile.value || logoClear.value,
        onSelect: onLogoSelected,
        onRevert: onLogoRevert,
        onDelete: onLogoDelete,
        triggerInput: () => logoInputRef.value?.click(),
    },
    {
        key: 'icon',
        label: t('settings.assets.icon'),
        hint: t('settings.assetHints.icon'),
        accept: '.ico,image/vnd.microsoft.icon,image/x-icon',
        preview: iconPreview,
        inputRef: iconInputRef,
        isDirty: !!iconFile.value || iconClear.value,
        onSelect: onIconSelected,
        onRevert: onIconRevert,
        onDelete: onIconDelete,
        triggerInput: () => iconInputRef.value?.click(),
    },
    {
        key: 'sign',
        label: t('settings.assets.sign'),
        hint: t('settings.assetHints.sign'),
        accept: 'image/jpeg,image/png,image/svg+xml,image/webp',
        preview: signPreview,
        inputRef: signInputRef,
        isDirty: !!signFile.value || signClear.value,
        onSelect: onSignSelected,
        onRevert: onSignRevert,
        onDelete: onSignDelete,
        triggerInput: () => signInputRef.value?.click(),
    },
])

let unsubscribe: UnsubscribeFunc | null = null

onMounted(async () => {
    unsubscribe = await pb
        .collection('settings')
        .subscribe<SettingsRecord>('settings_123456', (e) =>
            adoptRecord(e.record),
        )
})

onUnmounted(() => {
    unsubscribe?.()
})

const fieldUi = {
    container: 'w-full',
}

const formCardUi = {
    container: 'lg:grid-cols-2 gap-y-5',
    wrapper: 'lg:col-span-2',
}

const sections = computed(() => [
    {
        id: 'branding',
        label: t('settings.branding'),
        icon: 'i-lucide-image',
    },
    {
        id: 'organization',
        label: t('settings.organization'),
        icon: 'i-lucide-building-2',
    },
    {
        id: 'locations',
        label: t('settings.locations'),
        icon: 'i-lucide-map-pin',
    },
    {
        id: 'grading',
        label: t('settings.grading'),
        icon: 'i-lucide-trending-up',
    },
    {
        id: 'urls',
        label: t('settings.publicUrls'),
        icon: 'i-lucide-globe',
    },
    {
        id: 'legal',
        label: t('settings.legalTitle'),
        icon: 'i-lucide-scale',
    },
])

const route = useRoute()
const activeSection = computed(() => {
    const requested = String(route.query.section ?? '')
    return sections.value.some((section) => section.id === requested)
        ? requested
        : 'branding'
})

const sectionNavItems = computed(() =>
    sections.value.map((section) => ({
        label: section.label,
        icon: section.icon,
        to: { query: { section: section.id } },
        active: activeSection.value === section.id,
    })),
)

function onLogoSelected(file: File | null) {
    logoFile.value = file
    logoClear.value = false
    logoPreview.value = file
        ? URL.createObjectURL(file)
        : pbFileUrl(settings.value, settings.value?.page_logo)
}

function onIconSelected(file: File | null) {
    iconFile.value = file
    iconClear.value = false
    iconPreview.value = file
        ? URL.createObjectURL(file)
        : pbFileUrl(settings.value, settings.value?.page_icon)
}

function onSignSelected(file: File | null) {
    signFile.value = file
    signClear.value = false
    signPreview.value = file
        ? URL.createObjectURL(file)
        : pbFileUrl(settings.value, settings.value?.sign_image)
}

function onLogoRevert() {
    logoFile.value = null
    logoClear.value = false
    logoPreview.value = pbFileUrl(settings.value, settings.value?.page_logo)
}
function onLogoDelete() {
    logoClear.value = true
    logoPreview.value = null
}

function onIconRevert() {
    iconFile.value = null
    iconClear.value = false
    iconPreview.value = pbFileUrl(settings.value, settings.value?.page_icon)
}
function onIconDelete() {
    iconClear.value = true
    iconPreview.value = null
}

function onSignRevert() {
    signFile.value = null
    signClear.value = false
    signPreview.value = pbFileUrl(settings.value, settings.value?.sign_image)
}
function onSignDelete() {
    signClear.value = true
    signPreview.value = null
}

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
        copySettings.allow_registration !== original.allow_registration ||
        copySettings.route_grade_system !== original.route_grade_system ||
        copySettings.boulder_grade_system !== original.boulder_grade_system ||
        JSON.stringify(legalFieldsFrom(copySettings)) !==
            JSON.stringify(legalFieldsFrom(original)) ||
        !sameValue(copySettings.boulder_bands, original.boulder_bands)
    )
})

watch(settings, adoptRecord, { immediate: true })

async function saveSettings() {
    if (!hasChanges.value || saving.value) return
    await runSave(
        async () => {
            const payload = changedFieldsPayload()
            if (logoFile.value) payload.page_logo = logoFile.value
            else if (logoClear.value) payload.page_logo = null
            if (iconFile.value) payload.page_icon = iconFile.value
            else if (iconClear.value) payload.page_icon = null
            if (signFile.value) payload.sign_image = signFile.value
            else if (signClear.value) payload.sign_image = null

            const updated = await pb
                .collection('settings')
                .update<SettingsRecord>(settings.value!.id, payload)

            logoPreview.value = pbFileUrl(updated, updated.page_logo)
            iconPreview.value = pbFileUrl(updated, updated.page_icon)
            signPreview.value = pbFileUrl(updated, updated.sign_image)

            logoFile.value = iconFile.value = signFile.value = null
            logoClear.value = iconClear.value = signClear.value = false

            original.application_url = updated.application_url ?? ''
            original.imprint_url = updated.imprint_url ?? ''
            original.privacy_url = updated.privacy_url ?? ''
            original.organization_name = updated.organization_name ?? ''
            original.organization_unit_name =
                updated.organization_unit_name ?? ''
            original.contact_email = updated.contact_email ?? ''
            original.audit_retention_days = updated.audit_retention_days ?? 90
            original.allow_registration = !!updated.allow_registration
            original.route_grade_system =
                updated.route_grade_system || DEFAULT_ROUTE_GRADE_SYSTEM
            original.boulder_grade_system =
                updated.boulder_grade_system || DEFAULT_BOULDER_GRADE_SYSTEM
            Object.assign(
                original,
                legalFieldsFrom(updated),
                bandFieldsFrom(updated),
            )

            Object.assign(copySettings, {
                application_url: updated.application_url ?? '',
                imprint_url: updated.imprint_url ?? '',
                privacy_url: updated.privacy_url ?? '',
                organization_name: updated.organization_name ?? '',
                organization_unit_name: updated.organization_unit_name ?? '',
                contact_email: updated.contact_email ?? '',
                audit_retention_days: updated.audit_retention_days ?? 90,
                allow_registration: original.allow_registration,
                route_grade_system: original.route_grade_system,
                boulder_grade_system: original.boulder_grade_system,
                ...legalFieldsFrom(updated),
                ...bandFieldsFrom(updated),
            })
            settings.value = updated
        },
        {
            success: t('settings.saveSuccess'),
            error: t('settings.saveError'),
        },
    )
}
</script>

<style scoped>
@reference "~/assets/css/main.css";

.settings-nav-mobile {
    position: sticky;
    top: calc(var(--app-top) + var(--app-top-inset, 0px));
    z-index: 10;
    margin: 0 -16px 16px;
    padding: 0 16px;
    overflow-x: auto;
    background: var(--app-bg);
    scrollbar-width: none;
}

.settings-nav-desktop {
    position: sticky;
    top: calc(var(--app-top) + var(--app-top-inset, 0px) + 16px);
}

.asset-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--ui-border);
    border-radius: calc(var(--ui-radius) * 2);
    background: var(--ui-bg);
    transition: border-color 0.18s;
}

.asset-card--dirty {
    border-color: var(--ui-primary);
}

.asset-card__preview {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 160px;
    padding: 24px;
    border-bottom: 1px solid var(--ui-border);
    background-color: #f4f4f5;
    background-image:
        linear-gradient(45deg, #e4e4e7 25%, transparent 25%),
        linear-gradient(-45deg, #e4e4e7 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #e4e4e7 75%),
        linear-gradient(-45deg, transparent 75%, #e4e4e7 75%);
    background-size: 16px 16px;
    background-position:
        0 0,
        0 8px,
        8px -8px,
        -8px 0;
    cursor: pointer;
}

.asset-card__preview--empty {
    background: var(--ui-bg-muted);
    border-bottom-style: dashed;
}

.asset-card__preview:hover,
.asset-card__preview:focus-visible {
    outline: 2px solid var(--ui-primary);
    outline-offset: -2px;
}

.asset-card__image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.asset-card__image--mono {
    filter: brightness(0);
}

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

@variant max-sm {
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
</style>
