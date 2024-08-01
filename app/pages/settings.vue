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
                                    :src="pageLogo"
                                    height="100"
                                    contain
                                    @error="onImageError('logo')"
                                ></NuxtImg>
                            </div>
                            <v-file-input
                                variant="underlined"
                                hide-details
                                dense
                                flat
                                accept="image/jpeg, image/png, image/svg+xml, image/webp"
                                @change="updateLogo"
                                placeholder="Change logo"
                            ></v-file-input>
                        </v-card-text>
                    </v-card>
                </v-col>

                <v-col cols="12" md="4">
                    <v-card outlined tile flat>
                        <v-card-title class="text-h6">Page Icon</v-card-title>
                        <v-card-text>
                            <div
                                class="d-flex align-center justify-center"
                                style="height: 150px"
                            >
                                <NuxtImg
                                    :src="pageIcon"
                                    height="100"
                                    contain
                                ></NuxtImg>
                            </div>
                            <v-file-input
                                variant="underlined"
                                hide-details
                                dense
                                flat
                                accept="image/x-icon"
                                @change="updateIcon"
                                placeholder="Change icon"
                            ></v-file-input>
                        </v-card-text>
                    </v-card>
                </v-col>

                <v-col cols="12" md="4">
                    <v-card outlined tile flat>
                        <v-card-title class="text-h6">Sign Image</v-card-title>
                        <v-card-text>
                            <div
                                class="d-flex align-center justify-center"
                                style="height: 150px"
                            >
                                <NuxtImg
                                    :src="signImage"
                                    height="100"
                                    contain
                                ></NuxtImg>
                            </div>
                            <v-file-input
                                variant="underlined"
                                hide-details
                                dense
                                flat
                                accept="image/jpeg, image/png, image/svg+xml, image/webp"
                                @change="updateSignImage"
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
        </v-form>
    </v-container>
</template>

<script setup>
import { ref, reactive, watchEffect } from 'vue'

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

const settings = await pb.collection('settings').getOne('settings_123456')

const copySettings = reactive({
    application_url: settings.application_url,
    imprint_url: settings.imprint_url,
    privacy_url: settings.privacy_url,
})

const pageLogo = ref(pb.files.getUrl(settings, settings.page_logo))
const pageIcon = ref(pb.files.getUrl(settings, settings.page_icon))
const signImage = ref(pb.files.getUrl(settings, settings.sign_image))

// Subscribe to changes in the settings collection
pb.collection('settings').subscribe(
    'RECORD_ID',
    (e) => {
        Object.assign(copySettings, e.data)
        pageLogo.value = pb.files.getUrl(e.data, e.data.page_logo)
        pageIcon.value = pb.files.getUrl(e.data, e.data.page_icon)
        signImage.value = pb.files.getUrl(e.data, e.data.sign_image)
    },
    { recordId: 'settings_123456' },
)

const updateLogo = async (e) => {
    const file = e.target.files[0]
    const updatedSettings = await pb
        .collection('settings')
        .update(settings.id, {
            page_logo: file,
        })
    pageLogo.value = pb.files.getUrl(updatedSettings, updatedSettings.page_logo)
}

const updateIcon = async (e) => {
    const file = e.target.files[0]
    const updatedSettings = await pb
        .collection('settings')
        .update(settings.id, {
            page_icon: file,
        })
    pageIcon.value = pb.files.getUrl(updatedSettings, updatedSettings.page_icon)
}

const updateSignImage = async (e) => {
    const file = e.target.files[0]
    const updatedSettings = await pb
        .collection('settings')
        .update(settings.id, {
            sign_image: file,
        })
    signImage.value = pb.files.getUrl(
        updatedSettings,
        updatedSettings.sign_image,
    )
}

const saveSettings = async () => {
    try {
        await pb.collection('settings').update(settings.id, copySettings)
    } catch (error) {
        console.error('Save failed:', error)
    }
}

watchEffect(() => {
    saveSettings()
})
</script>
