<template>
    <template v-if="$route.meta.navbar !== false">
        <!-- Main App Bar -->
        <v-app-bar app flat height="64" class="nav-bar">
            <div class="nav-inner">
                <!-- Logo -->
                <router-link
                    to="/"
                    class="nav-logo"
                    :aria-label="$t('routes.home')"
                    data-testid="nav-logo"
                >
                    <img
                        v-if="logo_url"
                        :src="logo_url"
                        :alt="logoAlt"
                        :style="logoStyle"
                    />
                    <NuxtImg
                        v-else
                        :src="
                            theme.global.current.value.dark
                                ? '/verti-grade-dark.svg'
                                : '/verti-grade-light.svg'
                        "
                        :alt="logoAlt"
                        :style="defaultLogoStyle"
                        height="36"
                        densities="x1 x2"
                    />
                </router-link>

                <nav
                    v-if="isLoggedIn"
                    class="nav-links d-none d-lg-flex"
                    data-testid="nav-desktop-links"
                    :aria-label="$t('nav.mainNavigation')"
                >
                    <LayoutNavLink
                        v-for="item in visibleNav"
                        :key="item.key"
                        :to="item.to"
                        :icon="item.icon"
                        :label="item.label"
                        :group-key="item.children ? item.key : ''"
                        :children="item.children"
                    />
                </nav>

                <v-spacer />

                <!-- Right Side -->
                <div class="nav-actions">
                    <LayoutCommandPalette :pages="paletteLinks" />
                    <v-btn
                        icon
                        variant="text"
                        data-testid="nav-theme-toggle"
                        :data-theme-mode="themeMode"
                        :aria-label="`${$t('nav.themeToggle')}: ${$t(themeModeLabel)}`"
                        @click="cycleMode"
                    >
                        <v-icon>{{ themeModeIcon }}</v-icon>
                    </v-btn>
                    <template v-if="isLoggedIn">
                        <NotificationsBell />
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
                <template v-for="item in visibleNav" :key="item.key">
                    <v-list-subheader v-if="item.children" class="drawer-group">
                        {{ $t(item.label) }}
                    </v-list-subheader>
                    <v-list-item
                        v-for="link in item.children ?? [item]"
                        :key="link.to"
                        :to="link.to"
                        :prepend-icon="link.icon"
                        :title="$t(link.label)"
                        rounded="lg"
                        class="drawer-item"
                        active-class="drawer-item--active"
                        :data-testid="`nav-drawer-link-${navTestId(link.to)}`"
                        @click="drawer = false"
                    />
                </template>
            </v-list>

            <template #append>
                <v-divider class="mx-4 mb-3" />
                <div class="drawer-footer">
                    <UserIcon v-if="isLoggedIn && !lgAndUp" />
                </div>
            </template>
        </v-navigation-drawer>

        <v-divider />
    </template>
</template>

<script setup lang="ts">
import type { SettingsRecord } from '~/types/models'
const theme = useTheme()
const { mode: themeMode, cycleMode } = useThemeMode()
const themeModeIcon = computed(
    () =>
        ({
            system: 'mdi-theme-light-dark',
            light: 'mdi-weather-sunny',
            dark: 'mdi-weather-night',
        })[themeMode.value],
)
const themeModeLabel = computed(
    () =>
        ({
            system: 'nav.themeSystem',
            light: 'nav.themeLight',
            dark: 'nav.themeDark',
        })[themeMode.value],
)
const { lgAndUp } = useDisplay()

const props = defineProps<{
    loggedIn: boolean
    settings: Partial<SettingsRecord>
}>()

const { loggedIn, settings } = toRefs(props)
const logoAlt = computed(
    () => settings.value?.organization_name || 'Verti-Grade',
)

const { can } = usePermissions()

const navItems = [
    {
        key: 'home',
        to: '/',
        icon: 'mdi-home-outline',
        label: 'routes.home',
    },
    {
        key: 'routes',
        to: '/manage/routes',
        icon: 'mdi-map-marker-path',
        label: 'routes.dashboard',
        permission: 'manage_routes',
    },
    {
        key: 'manage',
        icon: 'mdi-tune-variant',
        label: 'nav.manage',
        children: [
            {
                to: '/manage/comments',
                icon: 'mdi-comment-outline',
                label: 'routes.comments',
                permission: 'manage_comments',
            },
            {
                to: '/manage/reports',
                icon: 'mdi-flag-outline',
                label: 'routes.reports',
                permission: 'manage_reports',
            },
            {
                to: '/manage/analytics',
                icon: 'mdi-chart-line',
                label: 'routes.analytics',
                permission: 'view_analytics',
            },
            {
                to: '/manage/inventory',
                icon: 'mdi-package-variant-closed',
                label: 'routes.inventory',
                permission: 'run_inventory',
            },
        ],
    },
    {
        key: 'admin',
        icon: 'mdi-shield-account-outline',
        label: 'nav.admin',
        children: [
            {
                to: '/admin/users',
                icon: 'mdi-account-group-outline',
                label: 'routes.users',
                permission: 'manage_users',
            },
            {
                to: '/admin/settings',
                icon: 'mdi-cog-outline',
                label: 'routes.settings',
                permission: 'manage_settings',
            },
        ],
    },
]

const allowed = (entry: { permission?: string }) =>
    !entry.permission || can(entry.permission)

const visibleNav = computed(() =>
    navItems
        .map((item) =>
            item.children
                ? { ...item, children: item.children.filter(allowed) }
                : item,
        )
        .filter((item) =>
            item.children ? item.children.length > 0 : allowed(item),
        ),
)

const paletteLinks = computed(() =>
    visibleNav.value.flatMap(
        (item) =>
            (item.children ?? [item]) as {
                to: string
                icon: string
                label: string
            }[],
    ),
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
    background: rgba(var(--v-theme-background), 0.82);
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
    background: rgb(var(--v-theme-surface));
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
    background: rgba(var(--v-theme-primary), 0.12);
    color: rgb(var(--v-theme-primary));
}

.drawer-footer {
    padding: 8px 16px 20px;
}
</style>
