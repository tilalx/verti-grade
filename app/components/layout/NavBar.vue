<template>
    <template v-if="$route.meta.navbar !== false">
        <!-- Main App Bar -->
        <v-app-bar app flat height="64" color="transparent" class="nav-bar">
            <div class="nav-inner">
                <!-- Logo -->
                <router-link
                    to="/"
                    class="nav-logo"
                    :aria-label="$t('routes.home')"
                >
                    <!-- Plain <img>: NuxtImg rewrites the src through
                         /_ipx, which cannot read PocketBase's uploads and
                         answers 403 in production. PocketBase already serves
                         a sized thumbnail via ?thumb=. -->
                    <img
                        v-if="logo_url"
                        :src="logo_url"
                        alt="Logo"
                        :style="logoStyle"
                    />
                    <NuxtImg
                        v-else
                        :src="
                            theme.global.current.value.dark
                                ? '/verti-grade-dark.svg'
                                : '/verti-grade-light.svg'
                        "
                        alt="Logo"
                        :style="defaultLogoStyle"
                        height="36"
                        densities="x1 x2"
                    />
                </router-link>

                <!-- Desktop Nav Links. Breakpoint via CSS, not useDisplay():
                     the viewport is unknown server-side, so a JS breakpoint
                     can't render here without a hydration mismatch.

                     lg, not md: the full link row plus the logo and the user
                     menu needs ~1040px, so between 960 and 1280 it used to
                     overflow -- the user menu got pushed off the right edge
                     while the viewport was still too wide for the drawer. -->
                <nav
                    v-if="isLoggedIn"
                    class="nav-links d-none d-lg-flex"
                    data-testid="nav-desktop-links"
                    :aria-label="$t('nav.mainNavigation')"
                >
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
                        <div class="d-none d-lg-flex">
                            <UserIcon />
                        </div>
                        <v-btn
                            icon
                            variant="text"
                            class="nav-hamburger d-lg-none"
                            data-testid="nav-hamburger"
                            @click="drawer = !drawer"
                            :aria-label="$t('nav.openMenu')"
                        >
                            <v-icon>mdi-menu</v-icon>
                        </v-btn>
                    </template>
                    <v-btn
                        v-else
                        to="/auth/login"
                        variant="tonal"
                        prepend-icon="mdi-login"
                        class="nav-login-btn"
                        data-testid="nav-login"
                    >
                        {{ $t('routes.login') }}
                    </v-btn>
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
            data-testid="nav-drawer"
            :aria-label="$t('nav.mainNavigation')"
        >
            <v-list nav density="compact" class="drawer-list">
                <v-list-item
                    v-for="link in visibleNavLinks"
                    :key="link.to"
                    :to="link.to"
                    :prepend-icon="link.icon"
                    :title="$t(link.label)"
                    rounded="lg"
                    class="drawer-item"
                    active-class="drawer-item--active"
                    :data-testid="`nav-drawer-link-${link.to.replace(/^\//, '').replaceAll('/', '-') || 'home'}`"
                    @click="drawer = false"
                />
            </v-list>

            <template #append>
                <v-divider class="mx-4 mb-3" />
                <!-- Off-canvas, so SSR buys nothing here — and a second
                     always-mounted UserIcon would duplicate its test ids. -->
                <div class="drawer-footer">
                    <UserIcon v-if="isLoggedIn && !lgAndUp" />
                </div>
            </template>
        </v-navigation-drawer>

        <v-divider />
    </template>
</template>

<script setup>
const theme = useTheme()
// Must track the CSS breakpoint above (d-lg-flex / d-lg-none): if these
// disagree, the drawer opens between 960 and 1280 with no user menu in it.
const { lgAndUp } = useDisplay()

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

const { can } = usePermissions()

const navLinks = [
    {
        to: '/',
        icon: 'mdi-home-outline',
        label: 'routes.home',
        permission: null,
    },
    {
        to: '/admin/routes',
        icon: 'mdi-map-marker-path',
        label: 'routes.dashboard',
        permission: 'manage_routes',
    },
    {
        to: '/admin/analytics',
        icon: 'mdi-chart-line',
        label: 'routes.analytics',
        permission: 'view_analytics',
    },
    {
        to: '/admin/comments',
        icon: 'mdi-comment-outline',
        label: 'routes.comments',
        permission: 'manage_comments',
    },
    {
        to: '/admin/users',
        icon: 'mdi-account-group-outline',
        label: 'routes.users',
        permission: 'manage_users',
    },
    {
        to: '/admin/reports',
        icon: 'mdi-flag-outline',
        label: 'routes.reports',
        permission: 'manage_reports',
    },
    {
        // No permission key: everyone sees their own activity here, and a
        // view_audit_log holder sees everyone's. The collection's list rule
        // decides which, so the link does not need to.
        to: '/activity',
        icon: 'mdi-clipboard-text-clock-outline',
        label: 'routes.activity',
    },
    {
        to: '/admin/inventory',
        icon: 'mdi-package-variant-closed',
        label: 'routes.inventory',
        permission: 'run_inventory',
        mobileOnly: true,
    },
    {
        to: '/admin/settings',
        icon: 'mdi-cog-outline',
        label: 'routes.settings',
        permission: 'manage_settings',
    },
]

const visibleNavLinks = computed(() =>
    navLinks.filter((l) => !l.permission || can(l.permission)),
)
const desktopLinks = computed(() =>
    visibleNavLinks.value.filter((l) => !l.mobileOnly),
)

watch(lgAndUp, (isDesktop) => {
    if (isDesktop) drawer.value = false
})

const logo_url = computed(() =>
    usePbFileUrl(settings.value, settings.value?.page_logo, { thumb: '0x200' }),
)

const logoStyle = computed(() => ({
    maxWidth: '90px',
    filter: `brightness(0) invert(${theme.global.current.value.dark ? 1 : 0})`,
    transition: 'filter 0.3s ease',
}))

const defaultLogoStyle = {
    maxWidth: '120px',
    height: '36px',
}

const isLoggedIn = computed(() => loggedIn.value)
const drawer = ref(false)
</script>

<style scoped>
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

.nav-logo {
    display: flex;
    align-items: center;
    text-decoration: none;
    flex-shrink: 0;
    margin-right: 8px;
}

/* No `display` here: scoped styles are unlayered, and Vuetify 4 ships its
   helpers inside @layer vuetify-utilities.helpers — an unlayered rule beats a
   layered one at any specificity, so `display: flex` here silently defeated
   the `d-none` half of `d-none d-lg-flex` and forced the desktop nav onto
   mobile (pushing the hamburger off-screen). Let the utilities own display. */
.nav-links {
    align-items: center;
    gap: 2px;
}

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

.mobile-drawer {
    background: rgb(var(--v-theme-surface)) !important;
}

.drawer-header {
    display: flex;
    align-items: center;
    padding: 16px 16px 12px;
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
