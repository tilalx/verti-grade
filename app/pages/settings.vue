<template>
    <v-container>
        <v-form>
            <v-row>
                <!-- Page Logo Upload -->
                <v-col cols="12" md="4">
                    <v-card outlined tile flat>
                        <v-card-title class="text-h6">Page Logo</v-card-title>
                        <v-card-text>
                            <div
                                class="d-flex align-center justify-center"
                                style="height: 150px"
                            >
                                <NuxtImg
                                    v-if="logoPreview"
                                    :src="logoPreview"
                                    height="100"
                                    contain
                                />
                                <div
                                    v-else
                                    class="placeholder"
                                    style="
                                        height: 100px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: gray;
                                    "
                                >
                                    No logo uploaded
                                </div>
                            </div>
                            <v-file-input
                                variant="underlined"
                                hide-details
                                dense
                                flat
                                accept="image/jpeg, image/png, image/svg+xml, image/webp"
                                v-model="logoFile"
                                @update:model-value="onLogoSelected"
                                placeholder="Select new logo"
                            />
                        </v-card-text>
                    </v-card>
                </v-col>

                <!-- Page Icon Upload -->
                <v-col cols="12" md="4">
                    <v-card outlined tile flat>
                        <v-card-title class="text-h6">Page Icon</v-card-title>
                        <v-card-text>
                            <div
                                class="d-flex align-center justify-center"
                                style="height: 150px"
                            >
                                <NuxtImg
                                    v-if="iconPreview"
                                    :src="iconPreview"
                                    height="100"
                                    contain
                                />
                                <div
                                    v-else
                                    class="placeholder"
                                    style="
                                        height: 100px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: gray;
                                    "
                                >
                                    No icon uploaded
                                </div>
                            </div>
                            <v-file-input
                                variant="underlined"
                                hide-details
                                dense
                                flat
                                accept=".ico,image/vnd.microsoft.icon,image/x-icon"
                                v-model="iconFile"
                                @update:model-value="onIconSelected"
                                placeholder="Select new icon"
                            />
                        </v-card-text>
                    </v-card>
                </v-col>

                <!-- Sign Image Upload -->
                <v-col cols="12" md="4">
                    <v-card outlined tile flat>
                        <v-card-title class="text-h6">Sign Image</v-card-title>
                        <v-card-text>
                            <div
                                class="d-flex align-center justify-center"
                                style="height: 150px"
                            >
                                <NuxtImg
                                    v-if="signPreview"
                                    :src="signPreview"
                                    height="100"
                                    contain
                                />
                                <div
                                    v-else
                                    class="placeholder"
                                    style="
                                        height: 100px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: gray;
                                    "
                                >
                                    No sign image uploaded
                                </div>
                            </div>
                            <v-file-input
                                variant="underlined"
                                hide-details
                                dense
                                flat
                                accept="image/jpeg, image/png, image/svg+xml, image/webp"
                                v-model="signFile"
                                @update:model-value="onSignSelected"
                                placeholder="Select new sign image"
                            />
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="12" md="6">
                    <v-text-field
                        label="Application URL"
                        v-model="copySettings.application_url"
                    />
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field
                        label="Imprint URL"
                        v-model="copySettings.imprint_url"
                    />
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field
                        label="Privacy URL"
                        v-model="copySettings.privacy_url"
                    />
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="12" class="text-right">
                    <v-btn
                        v-if="hasChanges"
                        color="success"
                        @click="saveSettings"
                    >
                        Save
                    </v-btn>
                </v-col>
            </v-row>
        </v-form>
    </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
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

// Fetch settings during SSR
const { data: settings } = await useAsyncData('settings', () =>
    pb.collection('settings').getOne('settings_123456'),
)

// Make original reactive so Vue tracks updates
const original = reactive({
    application_url: settings.value.application_url,
    imprint_url: settings.value.imprint_url,
    privacy_url: settings.value.privacy_url,
})

// Reactive copy for text fields
const copySettings = reactive({
    application_url: original.application_url,
    imprint_url: original.imprint_url,
    privacy_url: original.privacy_url,
})

// Refs for chosen File objects
const logoFile = ref(null)
const iconFile = ref(null)
const signFile = ref(null)

// Refs for preview URLs (initially from PB)
const logoPreview = ref(null)
const iconPreview = ref(null)
const signPreview = ref(null)

// Load initial previews & subscribe to updates
onMounted(() => {
    const rec = settings.value
    logoPreview.value = pb.files.getURL(rec, rec.page_logo)
    iconPreview.value = pb.files.getURL(rec, rec.page_icon)
    signPreview.value = pb.files.getURL(rec, rec.sign_image)

    pb.collection('settings').subscribe(
        'RECORD_ID',
        (e) => {
            Object.assign(copySettings, e.data)
            logoPreview.value = pb.files.getURL(e.data, e.data.page_logo)
            iconPreview.value = pb.files.getURL(e.data, e.data.page_icon)
            signPreview.value = pb.files.getURL(e.data, e.data.sign_image)
            // update original snapshot too
            original.application_url = e.data.application_url
            original.imprint_url = e.data.imprint_url
            original.privacy_url = e.data.privacy_url
        },
        { recordId: 'settings_123456' },
    )
})

// Handlers: store file + generate local preview
function onLogoSelected(file) {
    logoFile.value = file
    logoPreview.value = file
        ? URL.createObjectURL(file)
        : pb.files.getURL(settings.value, settings.value.page_logo)
}
function onIconSelected(file) {
    iconFile.value = file
    iconPreview.value = file
        ? URL.createObjectURL(file)
        : pb.files.getURL(settings.value, settings.value.page_icon)
}
function onSignSelected(file) {
    signFile.value = file
    signPreview.value = file
        ? URL.createObjectURL(file)
        : pb.files.getURL(settings.value, settings.value.sign_image)
}

// Computed “dirty” flag
const hasChanges = computed(() => {
    // any new file selected?
    if (logoFile.value || iconFile.value || signFile.value) return true
    // compare text fields against reactive original
    return (
        copySettings.application_url !== original.application_url ||
        copySettings.imprint_url !== original.imprint_url ||
        copySettings.privacy_url !== original.privacy_url
    )
})

// Save all at once
async function saveSettings() {
    if (!hasChanges.value) return

    const formData = new FormData()
    formData.append('application_url', copySettings.application_url)
    formData.append('imprint_url', copySettings.imprint_url)
    formData.append('privacy_url', copySettings.privacy_url)
    if (logoFile.value) formData.append('page_logo', logoFile.value)
    if (iconFile.value) formData.append('page_icon', iconFile.value)
    if (signFile.value) formData.append('sign_image', signFile.value)

    try {
        const updated = await pb
            .collection('settings')
            .update(settings.value.id, formData)

        // refresh previews to PB-hosted URLs
        logoPreview.value = pb.files.getURL(updated, updated.page_logo)
        iconPreview.value = pb.files.getURL(updated, updated.page_icon)
        signPreview.value = pb.files.getURL(updated, updated.sign_image)

        // clear file refs
        logoFile.value = iconFile.value = signFile.value = null

        // update reactive original & copySettings
        original.application_url = updated.application_url
        original.imprint_url = updated.imprint_url
        original.privacy_url = updated.privacy_url

        copySettings.application_url = updated.application_url
        copySettings.imprint_url = updated.imprint_url
        copySettings.privacy_url = updated.privacy_url
    } catch (err) {
        console.error('Save failed:', err)
        // TODO: user feedback
    }
}
</script>
