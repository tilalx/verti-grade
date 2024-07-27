<template>
    <v-app-bar app dense color="background" v-if="$route.meta.navbar !== false">
        <v-toolbar-title to="/">
            <router-link to="/">
                <img 
                    v-if="logo_url"
                    :src="logo_url"
                    alt="Logo"
                    :style="logoColor"
                />
                <img
                    v-else
                    src="@/assets/DAVLogoHanau.png"
                    alt="Logo"
                    :style="logoColor"
                />
            </router-link>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn text to="/">{{ $t('routes.home') }}</v-btn>
        <v-btn v-if="isLoggedIn" text to="/dashboard">{{
            $t('routes.dashboard')
        }}</v-btn>
        <v-btn v-if="!isLoggedIn" text to="/login">
            <v-icon class="mdi mdi-login"></v-icon>
        </v-btn>
        <v-btn v-if="isLoggedIn" text to="/comments">{{
            $t('routes.comments')
        }}</v-btn>
        <v-btn v-if="isLoggedIn" text to="/settings">{{
            $t('routes.settings')
        }}</v-btn>
        <UserIcon v-if="isLoggedIn"></UserIcon>
    </v-app-bar>
    <v-divider></v-divider>
</template>

<script setup>
import { computed, toRefs } from 'vue'
import UserIcon from '@/components/user/UserIcon.vue'

const pb = usePocketbase()

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
const theme = getTheme()
const logo_url = await pb.files.getUrl(settings.value, settings.value?.page_logo)

const logoColor = computed(() => ({
    maxWidth: '90px',
    filter: `brightness(0) invert(${theme.value === 'dark' ? 1 : 0})`,
}))

const isLoggedIn = loggedIn
</script>
