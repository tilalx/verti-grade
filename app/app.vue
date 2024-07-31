<template>
    <v-app class="fontbody">
        <NavBar :loggedIn="isLoggedIn" :settings="settings" />
        <v-main>
            <NuxtPage />
        </v-main>
        <FootBar :settings="settings" />
    </v-app>
</template>

<script setup>
import { getTheme } from './composables/getTheme';
import NavBar from '@/components/layout/NavBar.vue'
import FootBar from '@/components/layout/FootBar.vue'

const pb = usePocketbase()
const theme = getTheme()
const isLoggedIn = ref(pb.authStore.isValid)
let intervalId = null

const getSettings = async () => {
    try {
        const settings = await pb.collection('settings').getOne('settings_123456');
        return settings;
    } catch (error) {
        if (error.data && error.data.code === 404) {
            console.log('Settings not found, creating new settings');
            try {
                const newSettings = await pb.collection('settings').create({
                    id: 'settings_123456'
                });
                return newSettings;
            } catch (createError) {
                console.error('Error creating new settings:', createError);
                throw createError;
            }
        } else {
            console.error('An error occurred:', error);
            throw error;
        }
    }
}

const settings = await getSettings()

const checkSession = async () => {
    isLoggedIn.value = pb.authStore.isValid
}

const refreshSession = async () => {
    try {
        isLoggedIn.value = pb.authStore.isValid
        pb.authStore.refresh()
    } catch (error) {
        isLoggedIn.value = false
    }
}

const setFavicon = () => {
    if (!settings?.page_icon) return
    const favUrl = pb.files.getUrl(settings, settings.page_icon)
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = favUrl;
}


// When the component is mounted, check the session immediately
onMounted(async () => {
    await refreshSession()
})

onMounted(() => {
    setFavicon()
    intervalId = setInterval(() => {
        checkSession()
    }, 600)
})
</script>
