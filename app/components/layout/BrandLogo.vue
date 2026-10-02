<template>
    <NuxtLink
        to="/"
        class="flex shrink-0 items-center no-underline"
        :aria-label="$t('routes.home')"
        data-testid="nav-logo"
    >
        <img
            v-if="logoUrl"
            :src="logoUrl"
            :alt="logoAlt"
            class="brand-logo__custom"
            data-testid="nav-logo-custom"
        />
        <template v-else>
            <NuxtImg
                src="/gripello-light.svg"
                :alt="logoAlt"
                class="brand-logo__default brand-logo__default--light"
                height="36"
                densities="x1 x2"
            />
            <NuxtImg
                src="/gripello-dark.svg"
                :alt="logoAlt"
                class="brand-logo__default brand-logo__default--dark"
                height="36"
                densities="x1 x2"
            />
        </template>
    </NuxtLink>
</template>

<script setup lang="ts">
import type { SettingsRecord } from '~/types/models'

const props = defineProps<{ settings: Partial<SettingsRecord> }>()

const logoAlt = computed(() => props.settings?.organization_name || 'Gripello')
const logoUrl = computed(() =>
    usePbFileUrl(props.settings, props.settings?.page_logo, { thumb: '0x200' }),
)
</script>

<style scoped>
.brand-logo__custom {
    max-width: 90px;
    max-height: 44px;
    filter: brightness(0);
    transition: filter 0.3s ease;
}

.dark .brand-logo__custom {
    filter: brightness(0) invert(1);
}

.brand-logo__default {
    max-width: 120px;
    height: 36px;
}

.brand-logo__default--dark,
.dark .brand-logo__default--light {
    display: none;
}

.dark .brand-logo__default--dark {
    display: inline;
}
</style>
