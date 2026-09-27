<template>
    <v-bottom-navigation
        :height="64"
        grow
        tag="nav"
        class="bottom-nav d-lg-none"
        :aria-label="$t('nav.quickNavigation')"
        data-testid="bottom-nav"
    >
        <v-btn
            v-for="item in BOTTOM_NAV"
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
import { BOTTOM_NAV } from '~/utils/navigation'
</script>

<style scoped>
.bottom-nav {
    left: 0;
    width: calc(
        100% - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)
    );
    background: rgb(var(--v-theme-surface));
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    padding: 0 env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px)
        env(safe-area-inset-left, 0px);
    box-sizing: content-box;
}

@media (max-width: 1144.98px) {
    :global(.v-main) {
        --app-bottom-inset: env(safe-area-inset-bottom, 0px);
        padding-bottom: calc(var(--v-layout-bottom) + var(--app-bottom-inset));
    }
}

@media (min-width: 1145px) {
    :global(.v-main) {
        --v-layout-bottom: 0px !important;
    }
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
