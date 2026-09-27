<template>
    <v-bottom-navigation
        :active="!lgAndUp"
        :height="64"
        grow
        tag="nav"
        class="bottom-nav"
        :aria-label="$t('nav.quickNavigation')"
        data-testid="bottom-nav"
    >
        <v-btn
            v-for="item in items"
            :key="item.to"
            :to="item.to"
            :exact="item.to === '/account'"
            :ripple="false"
            class="bottom-nav__item"
            :data-testid="`bottom-nav-${navTestId(item.to)}`"
        >
            <span class="bottom-nav__pill">
                <v-icon size="22">{{ item.icon }}</v-icon>
            </span>
            <span class="bottom-nav__label">{{ $t(item.label) }}</span>
        </v-btn>
    </v-bottom-navigation>
</template>

<script setup lang="ts">
const { lgAndUp } = useDisplay()

const items = [
    { to: '/map', icon: 'mdi-map-outline', label: 'routes.map' },
    { to: '/scan', icon: 'mdi-qrcode-scan', label: 'routes.scan' },
    {
        to: '/logbook',
        icon: 'mdi-notebook-check-outline',
        label: 'routes.logbook',
    },
    { to: '/account', icon: 'mdi-account-circle-outline', label: 'routes.me' },
]
</script>

<style scoped>
.bottom-nav {
    background: rgb(var(--v-theme-surface)) !important;
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    padding-bottom: env(safe-area-inset-bottom, 0px);
    box-sizing: content-box;
}

.bottom-nav__item {
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.bottom-nav__item :deep(.v-btn__overlay),
.bottom-nav__item :deep(.v-btn__underlay) {
    display: none;
}

.bottom-nav__item :deep(.v-btn__content) {
    flex-direction: column;
    gap: 4px;
}

.bottom-nav__pill {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 30px;
    border-radius: 15px;
    transition: background-color 0.2s ease;
}

.bottom-nav__label {
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    text-transform: none;
}

.bottom-nav__item.v-btn--active {
    color: rgb(var(--v-theme-on-surface));
}

.bottom-nav__item.v-btn--active .bottom-nav__pill {
    background: rgba(var(--v-theme-primary), 0.18);
    color: rgb(var(--v-theme-primary));
}

.bottom-nav__item.v-btn--active .bottom-nav__label {
    font-weight: 700;
}

.bottom-nav__item:focus-visible .bottom-nav__pill {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
}
</style>
