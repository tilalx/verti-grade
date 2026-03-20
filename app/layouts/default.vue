<template>
    <LayoutNavBar :loggedIn="isLoggedIn" :settings="settings" />
    <v-main>
        <NuxtPage />
    </v-main>

    <LayoutFootBar :settings="settings" />
</template>

<script setup>

const pb = usePocketbase()
const isLoggedIn = ref(pb.authStore.isValid)

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

const { data: settingsData } = await useAsyncData('settings', getSettings, { lazy: true })

const settings = ref(settingsData.value ?? {})
watch(settingsData, (val) => { if (val) settings.value = val })

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
    const favUrl = pb.files.getURL(settings.value, settings.value.page_icon)
    let link =
        document.querySelector("link[rel~='icon']") ||
        document.createElement('link')
    link.rel = 'icon'
    link.href = favUrl
    document.head.appendChild(link)
}

let unsubAuthChange = null
let unsubUser = null
let unsubSettings = null

async function subscribeToUser(userId) {
    unsubUser?.()
    unsubUser = await pb.collection('users').subscribe(userId, (e) => {
        if (e.action === 'delete') {
            pb.authStore.clear()
        } else {
            pb.authStore.save(pb.authStore.token, e.record)
            isLoggedIn.value = true
        }
    })
}

onMounted(async () => {
    try {
        if (pb.authStore.isValid) {
            await refreshSession()
        }
        setFavicon()

        // Reflect any local auth store changes immediately (login/logout on this tab)
        unsubAuthChange = pb.authStore.onChange((token, record) => {
            isLoggedIn.value = !!token
            if (token && record?.id) {
                subscribeToUser(record.id)
            } else {
                unsubUser?.()
                unsubUser = null
            }
        })

        // Subscribe to current user record for cross-device auth sync
        if (pb.authStore.isValid && pb.authStore.record?.id) {
            await subscribeToUser(pb.authStore.record.id)
        }

        // Realtime settings sync across devices
        unsubSettings = await pb.collection('settings').subscribe('settings_123456', (e) => {
            settings.value = e.record
            setFavicon()
        })
    } catch (error) {
        console.error('Error during initialization:', error)
    }
})

onBeforeUnmount(() => {
    unsubAuthChange?.()
    unsubUser?.()?.catch?.(() => {})
    unsubSettings?.()?.catch?.(() => {})
})
</script>
