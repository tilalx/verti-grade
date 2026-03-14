<template>
    <template v-if="$route.meta.navbar !== false">
        <!-- Main App Bar -->
        <v-app-bar
            app
            flat
            height="64"
            color="transparent"
            class="nav-bar"
        >
            <div class="nav-inner">
                <!-- Logo -->
                <router-link to="/" class="nav-logo">
                    <NuxtImg
                        v-if="logo_url"
                        :src="logo_url"
                        alt="Logo"
                        :style="logoStyle"
                    />
                    <NuxtImg
                        v-else
                        src="/DAVLogoHanau.png"
                        alt="Logo"
                        :style="logoStyle"
                        height="36"
                        densities="x1 x2"
                    />
                </router-link>

                <!-- Desktop Nav Links -->
                <nav v-if="isLoggedIn && mdAndUp" class="nav-links">
                    <LayoutNavLink
                        v-for="link in desktopLinks"
                        :key="link.to"
                        :to="link.to"
                        :icon="link.icon"
                        :label="$t(link.label)"
                    />
                </nav>

                <v-spacer />

                <!-- Right Side -->
                <div class="nav-actions">
                    <template v-if="isLoggedIn">
                        <UserIcon v-show="mdAndUp" />
                        <v-btn
                            v-if="!mdAndUp"
                            icon
                            variant="text"
                            class="nav-hamburger"
                            @click="drawer = !drawer"
                            :aria-label="$t('nav.openMenu')"
                        >
                            <v-icon :icon="drawer ? 'mdi-close' : 'mdi-menu'" />
                        </v-btn>
                    </template>
                    <template v-else>
                        <v-btn
                            to="/login"
                            variant="tonal"
                            rounded="lg"
                            prepend-icon="mdi-login"
                            class="nav-login-btn"
                        >
                            {{ $t('routes.login') }}
                        </v-btn>
                    </template>
                </div>
            </div>
        </v-app-bar>

        <!-- Mobile Drawer -->
        <v-navigation-drawer
            v-model="drawer"
            location="right"
            temporary
            width="260"
            class="mobile-drawer"
        >
            <div class="drawer-header">
                <NuxtImg
                    v-if="logo_url"
                    :src="logo_url"
                    alt="Logo"
                    :style="logoStyle"
                    height="30"
                />
                <NuxtImg
                    v-else
                    src="/DAVLogoHanau.png"
                    alt="Logo"
                    :style="logoStyle"
                    height="30"
                    densities="x1 x2"
                />
            </div>

            <v-divider class="mx-4 mb-2" />

            <v-list nav density="compact" class="drawer-list">
                <v-list-item
                    v-for="link in navLinks"
                    :key="link.to"
                    :to="link.to"
                    :prepend-icon="link.icon"
                    :title="$t(link.label)"
                    rounded="lg"
                    class="drawer-item"
                    active-class="drawer-item--active"
                />
            </v-list>

            <template #append>
                <v-divider class="mx-4 mb-3" />
                <div class="drawer-footer">
                    <UserIcon v-if="isLoggedIn" />
                </div>
            </template>
        </v-navigation-drawer>

        <v-divider />
    </template>
</template>

<script setup>
import { useTheme, useDisplay } from 'vuetify'

const pb = usePocketbase()
const theme = useTheme()
const { mdAndUp } = useDisplay()

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

// Nav link definitions — single source of truth for both desktop + mobile
const navLinks = [
    { to: '/',                  icon: 'mdi-home-outline',           label: 'routes.home'      },
    { to: '/admin/routes',      icon: 'mdi-map-marker-path',        label: 'routes.dashboard' },
    { to: '/admin/analytics',   icon: 'mdi-chart-line',             label: 'routes.analytics' },
    { to: '/admin/comments',    icon: 'mdi-comment-outline',        label: 'routes.comments'  },
    { to: '/admin/inventory',   icon: 'mdi-package-variant-closed', label: 'routes.inventory', mobileOnly: true },
    { to: '/admin/settings',    icon: 'mdi-cog-outline',            label: 'routes.settings'  },
]

const desktopLinks = computed(() => navLinks.filter(l => !l.mobileOnly))

// Close drawer when resizing to desktop
watch(mdAndUp, (isDesktop) => {
    if (isDesktop) drawer.value = false
})

const logo_url = ref('')

onMounted(async () => {
    if (settings.value?.page_logo) {
        logo_url.value = await pb.files.getURL(
            settings.value,
            settings.value.page_logo,
            { thumb: '0x200' }
        )
    }
})

const logoStyle = computed(() => ({
    maxWidth: '90px',
    filter: `brightness(0) invert(${theme.global.current.value.dark ? 1 : 0})`,
    transition: 'filter 0.3s ease',
}))

const isLoggedIn = computed(() => loggedIn.value)
const drawer = ref(false)
</script>

<style scoped>
/* ── Bar shell ──────────────────────────────────────── */
.nav-bar {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
    background: rgba(var(--v-theme-background), 0.82) !important;
}

.nav-inner {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0 16px;
    gap: 8px;
}

/* ── Logo ───────────────────────────────────────────── */
.nav-logo {
    display: flex;
    align-items: center;
    text-decoration: none;
    flex-shrink: 0;
    margin-right: 8px;
}

/* ── Desktop links ──────────────────────────────────── */
.nav-links {
    display: flex;
    align-items: center;
    gap: 2px;
}

/* ── Actions cluster ────────────────────────────────── */
.nav-actions {
    display: flex;
    align-items: center;
    gap: 4px;
}

.nav-hamburger {
    opacity: 0.8;
}

.nav-login-btn {
    font-weight: 600;
    letter-spacing: 0.01em;
    font-size: 0.85rem;
}

/* ── Mobile drawer ──────────────────────────────────── */
.mobile-drawer {
    background: rgb(var(--v-theme-surface)) !important;
}

.drawer-header {
    display: flex;
    align-items: center;
    padding: 20px 20px 16px;
}

.drawer-list {
    padding: 0 8px;
}

.drawer-item {
    margin-bottom: 2px;
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    transition: background 0.15s ease;
}

.drawer-item--active {
    background: rgba(var(--v-theme-primary), 0.12) !important;
    color: rgb(var(--v-theme-primary)) !important;
}

.drawer-footer {
    padding: 8px 16px 20px;
}
</style>