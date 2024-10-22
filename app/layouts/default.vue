<template>
    <NavBar :loggedIn="isLoggedIn" :settings="settings" />
    <v-main>
        <v-container>
            <NuxtPage />
        </v-container>
    </v-main>

    <FootBar :settings="settings" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import NavBar from '~/components/layout/NavBar.vue'
import FootBar from '~/components/layout/FootBar.vue'

const pb = usePocketbase()
const isLoggedIn = ref(pb.authStore.isValid)
let intervalId = null

const getSettings = async () => {
  try {
    return await pb.collection('settings').getOne('settings_123456')
  } catch (error) {
    if (error.data && error.data.code === 404) {
      console.log('Settings not found, creating new settings')
      try {
        return await pb.collection('settings').create({
          id: 'settings_123456',
        })
      } catch (createError) {
        console.error('Error creating new settings:', createError)
        throw createError
      }
    }
    console.error('An error occurred:', error)
    throw error
  }
}

const { data: settingsData } = await useAsyncData('settings', getSettings)

const settings = ref(settingsData.value)

const refreshSession = async () => {
    try {
        await pb.collection('users').authRefresh()
        isLoggedIn.value = pb.authStore.isValid
    } catch (error) {
        isLoggedIn.value = false
        console.error('Error refreshing session:', error)
    }
}

const setFavicon = () => {
    if (!settings.value?.page_icon) return
    const favUrl = pb.files.getUrl(settings.value, settings.value.page_icon)
    let link =
        document.querySelector("link[rel~='icon']") ||
        document.createElement('link')
    link.rel = 'icon'
    link.href = favUrl
    document.head.appendChild(link)
}

const checkSession = async () => {
    isLoggedIn.value = pb.authStore.isValid
}

onMounted(async () => {
    try {
        if(pb.authStore.isValid)(
            await refreshSession()
        )
        setFavicon()

        intervalId = setInterval(checkSession, 600)
    } catch (error) {
        // Handle error (e.g., display notification to user)
        console.error('Error during initialization:', error)
    }
})

onBeforeUnmount(() => {
    if (intervalId) {
        clearInterval(intervalId)
    }
})
</script>
