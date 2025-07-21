<template>
    <v-app-bar app dense color="background" v-if="$route.meta.navbar !== false">
        <v-toolbar-title>
            <router-link to="/">
                <NuxtImg
                    v-if="logo_url"
                    :src="logo_url"
                    alt="Logo"
                    :style="logoColor"
                />
                <NuxtImg
                    v-else
                    src="/DAVLogoHanau.png"
                    alt="Logo"
                    :style="logoColor"
                    height="50"
                    densities="x1 x2"

                />
            </router-link>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <template v-if="isLoggedIn">
            <v-btn text class="d-none d-md-inline-flex" to="/">{{
                $t('routes.home')
            }}</v-btn>
            <v-btn text class="d-none d-md-inline-flex" to="/dashboard">{{
                $t('routes.dashboard')
            }}</v-btn>
            <v-btn text class="d-none d-md-inline-flex" to="/comments">{{
                $t('routes.comments')
            }}</v-btn>
            <v-btn text class="d-none d-md-inline-flex" to="/settings">{{
                $t('routes.settings')
            }}</v-btn>
            <UserIcon class="d-none d-md-inline-flex"></UserIcon>
        </template>
        <v-btn v-if="!isLoggedIn" text to="/login">
            <v-icon class="mdi mdi-login"></v-icon>
        </v-btn>
        <v-btn
            v-if="isLoggedIn"
            icon
            @click="drawer = !drawer"
            class="d-md-none"
        >
            <v-icon>mdi-menu</v-icon>
        </v-btn>
    </v-app-bar>
    <v-navigation-drawer
        v-model="drawer"
        location="right"
        app
        temporary
        class="d-md-none"
    >
        <v-list-item to="/">
            {{ $t('routes.home') }}
        </v-list-item>
        <v-list-item to="/dashboard">
            {{ $t('routes.dashboard') }}
        </v-list-item>
        <v-list-item to="/comments">
            {{ $t('routes.comments') }}
        </v-list-item>
        <v-list-item to="/settings">
            {{ $t('routes.settings') }}
        </v-list-item>
        <v-list-item>
            <UserIcon v-if="isLoggedIn" />
        </v-list-item>
    </v-navigation-drawer>
    <v-divider></v-divider>
</template>

<script setup>
import { useTheme } from 'vuetify'
const pb = usePocketbase()
const theme = useTheme()

const props = defineProps({
    loggedIn: {
        type: Boolean,
        required: true,
        default: false,
    },
    settings: {
        type: Object,
        required: true,
    },
})

const { loggedIn, settings } = toRefs(props)


let logo_url = ref('')

onMounted(async () => {
    if (settings.value && settings.value.page_logo) {
        logo_url.value = await pb.files.getURL(
            settings.value,
            settings.value.page_logo,
            { thumb: '0x200' }
        )
    }
})

const logoColor = computed(() => ({
    maxWidth: '90px',
    filter: `brightness(0) invert(${theme.global.current.value.dark ? 1 : 0})`,
}))

const isLoggedIn = computed(() => loggedIn.value)
const drawer = ref(false)
</script>