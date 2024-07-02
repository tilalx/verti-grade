<template>
    <v-app-bar app dense color="background" v-if="$route.meta.navbar !== false">
        <v-toolbar-title to="/">
            <router-link to="/">
                <img
                    src="@/assets/DAVLogoHanau.png"
                    alt="Logo"
                    :style="logoColor"
                />
            </router-link>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn text to="/">Home</v-btn>
        <v-btn v-if="isLoggedIn" text to="/dashboard">{{
            $t('routes.dashboard')
        }}</v-btn>
        <v-btn v-if="!isLoggedIn" text to="/login">
            <v-icon class="mdi mdi-login"></v-icon>
        </v-btn>
        <v-btn v-if="isLoggedIn" text to="/comments">{{
            $t('routes.comments')
        }}</v-btn>
        <!-- <v-btn v-if="isLoggedIn" text to="/statistics">{{ $t("routes.statistics") }}</v-btn> -->
        <v-btn v-if="isLoggedIn" text to="/settings">{{
            $t('routes.settings')
        }}</v-btn>
        <log-out v-if="isLoggedIn"></log-out>
    </v-app-bar>
    <v-divider></v-divider>
</template>

<script>
import LogOut from '@/components/auth/LogOut.vue'
import { toRefs, watch } from 'vue'
import { useMainStore } from '@/stores/main'
export default {
    name: 'NavBar',
    components: {
        LogOut,
    },
    props: {
        loggedIn: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    setup(props) {
        const { loggedIn } = toRefs(props)
        const theme = ref(useMainStore().getColorTheme)

        const logoColor = computed(() => ({
            maxWidth: '90px',
            filter: `brightness(0) invert(${theme.value === 'dark' ? 1 : 0})`,
        }))

        watch(
            () => useMainStore().getColorTheme,
            (newTheme) => {
                theme.value = newTheme
            },
        )

        return {
            isLoggedIn: loggedIn,
            theme,
            logoColor,
        }
    },
}
</script>
