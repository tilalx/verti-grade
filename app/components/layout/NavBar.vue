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
                        class="nav-logo__custom"
                        data-testid="nav-logo-custom"
                    />
                    <template v-else>
                        <NuxtImg
                            src="/gripello-light.svg"
                            :alt="logoAlt"
                            class="nav-logo__default nav-logo__default--light"
                            height="36"
                            densities="x1 x2"
                        />
                        <NuxtImg
                            src="/gripello-dark.svg"
                            :alt="logoAlt"
                            class="nav-logo__default nav-logo__default--dark"
                            height="36"
                            densities="x1 x2"
                        />
                    </template>
                </router-link>

                <nav
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
    </template>
</template>

<script setup lang="ts">
import type { SettingsRecord } from '~/types/models'
import { visibleNavItems } from '~/utils/navigation'
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

const props = defineProps<{
    loggedIn: boolean
    settings: Partial<SettingsRecord>
}>()

const { loggedIn, settings } = toRefs(props)
const logoAlt = computed(() => settings.value?.organization_name || 'Gripello')

const { can } = usePermissions()

const visibleNav = computed(() => visibleNavItems(can, isLoggedIn.value))

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

const logo_url = computed(() =>
    usePbFileUrl(settings.value, settings.value?.page_logo, { thumb: '0x200' }),
)

const isLoggedIn = computed(() => loggedIn.value)
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
    padding: 0 max(16px, env(safe-area-inset-right, 0px)) 0
        max(16px, env(safe-area-inset-left, 0px));
    gap: 8px;
}

.nav-logo {
    display: flex;
    align-items: center;
    text-decoration: none;
    flex-shrink: 0;
    margin-right: 8px;
}

.nav-logo__custom {
    max-width: 90px;
    filter: brightness(0);
    transition: filter 0.3s ease;
}

.v-theme--dark .nav-logo__custom {
    filter: brightness(0) invert(1);
}

.nav-logo__default {
    max-width: 120px;
    height: 36px;
}

.nav-logo__default--dark,
.v-theme--dark .nav-logo__default--light {
    display: none;
}

.v-theme--dark .nav-logo__default--dark {
    display: inline;
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

.nav-login-btn {
    font-weight: 600;
    letter-spacing: 0.01em;
    font-size: 0.85rem;
}
</style>
