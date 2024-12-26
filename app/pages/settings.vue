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
                                    v-if="pageLogo"
                                    :src="pageLogo"
                                    height="100"
                                    contain
                                ></NuxtImg>
                                <div
                                    v-else
                                    class="placeholder"
                                    style="height: 100px; display: flex; align-items: center; justify-content: center; color: gray;"
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
                                @change="(files) => updateLogo(files[0])"
                                placeholder="Change logo"
                            ></v-file-input>
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
                                    v-if="pageIcon"
                                    :src="pageIcon"
                                    height="100"
                                    contain
                                ></NuxtImg>
                                <div
                                    v-else
                                    class="placeholder"
                                    style="height: 100px; display: flex; align-items: center; justify-content: center; color: gray;"
                                >
                                    No icon uploaded
                                </div>
                            </div>
                            <v-file-input
                                variant="underlined"
                                hide-details
                                dense
                                flat
                                accept="image/x-icon"
                                @change="(files) => updateIcon(files[0])"
                                placeholder="Change icon"
                            ></v-file-input>
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
                                    v-if="signImage"
                                    :src="signImage"
                                    height="100"
                                    contain
                                ></NuxtImg>
                                <div
                                    v-else
                                    class="placeholder"
                                    style="height: 100px; display: flex; align-items: center; justify-content: center; color: gray;"
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
                                @change="(files) => updateSignImage(files[0])"
                                placeholder="Change sign image"
                            ></v-file-input>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
            <v-row>
                <v-col cols="12" md="6">
                    <v-text-field
                        label="Application URL"
                        v-model="copySettings.application_url"
                    ></v-text-field>
                </v-col>
                <v-col cols="12" md="6"></v-col>
                <v-col cols="12" md="6">
                    <v-text-field
                        label="Imprint URL"
                        v-model="copySettings.imprint_url"
                    ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field
                        label="Privacy URL"
                        v-model="copySettings.privacy_url"
                    ></v-text-field>
                </v-col>
            </v-row>
            <v-row>
                <v-col cols="12" class="text-right">
                    <v-btn color="primary" @click="saveSettings">Save</v-btn>
                </v-col>
            </v-row>
        </v-form>
    </v-container>
</template>

<script setup>
const pb = usePocketbase()
const { t } = useI18n()

useHead({
    title: t('page.title.settings'),
    meta: [
        {
            name: 'description',
            content: t('page.content.settings'),
        },
    ],
})

definePageMeta({
    authRequired: true,
    middleware: ['auth'],
})

// Fetch settings during SSR
const { data: settings } = await useAsyncData('settings', () =>
    pb.collection('settings').getOne('settings_123456'),
)

// Reactive copy of settings for two-way binding
const copySettings = reactive({
    application_url: settings.value.application_url,
    imprint_url: settings.value.imprint_url,
    privacy_url: settings.value.privacy_url,
})

// Refs for image URLs, initialized as null
const pageLogo = ref(null)
const pageIcon = ref(null)
const signImage = ref(null)

onMounted(() => {
    // Compute image URLs only on the client side
    pageLogo.value = pb.files.getURL(settings.value, settings.value.page_logo)
    pageIcon.value = pb.files.getURL(settings.value, settings.value.page_icon)
    signImage.value = pb.files.getURL(settings.value, settings.value.sign_image)

    // Subscribe to changes in the settings collection
    pb.collection('settings').subscribe(
        'RECORD_ID',
        (e) => {
            Object.assign(copySettings, e.data)
            pageLogo.value = pb.files.getURL(e.data, e.data.page_logo)
            pageIcon.value = pb.files.getURL(e.data, e.data.page_icon)
            signImage.value = pb.files.getURL(e.data, e.data.sign_image)
        },
        { recordId: 'settings_123456' },
    )
})

// Update functions for images
const updateLogo = async (file) => {
    const updatedSettings = await $pb
        .collection('settings')
        .update(settings.value.id, {
            page_logo: file,
        })
    pageLogo.value = pb.files.getURL(updatedSettings, updatedSettings.page_logo)
}

const updateIcon = async (file) => {
    const updatedSettings = await $pb
        .collection('settings')
        .update(settings.value.id, {
            page_icon: file,
        })
    pageIcon.value = pb.files.getURL(updatedSettings, updatedSettings.page_icon)
}

const updateSignImage = async (file) => {
    const updatedSettings = await $pb
        .collection('settings')
        .update(settings.value.id, {
            sign_image: file,
        })
    signImage.value = pb.files.getURL(
        updatedSettings,
        updatedSettings.sign_image,
    )
}

// Save settings when the user clicks the "Save" button
const saveSettings = async () => {
    try {
        await pb.collection('settings').update(settings.value.id, copySettings)
        // Optionally show a success message or refresh data
    } catch (error) {
        console.error('Save failed:', error)
        // Optionally show an error message to the user
    }
}
</script>
