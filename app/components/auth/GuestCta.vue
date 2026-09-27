<script setup lang="ts">
defineProps<{
    redirect: string
    testIdPrefix: string
}>()

const { allowRegistration } = useOrgSettings()
</script>

<template>
    <v-card border flat :data-testid="`${testIdPrefix}-guest`">
        <v-card-text class="text-center pa-6">
            <v-icon size="56" class="guest-cta__icon mb-3"
                >mdi-account-circle-outline</v-icon
            >
            <p class="text-title-medium mb-1">{{ $t('me.guestTitle') }}</p>
            <p class="text-body-medium text-medium-emphasis mb-5">
                {{ $t('me.guestIntro') }}
            </p>
            <div class="d-flex flex-column ga-2">
                <v-btn
                    color="primary"
                    size="large"
                    :to="{ path: '/auth/login', query: { redirect } }"
                    :data-testid="`${testIdPrefix}-login`"
                >
                    {{ $t('routes.login') }}
                </v-btn>
                <v-btn
                    v-if="allowRegistration"
                    variant="tonal"
                    size="large"
                    :to="{
                        path: '/auth/login',
                        query: { view: 'register', redirect },
                    }"
                    :data-testid="`${testIdPrefix}-register`"
                >
                    {{ $t('me.register') }}
                </v-btn>
            </div>
        </v-card-text>
    </v-card>
</template>

<style scoped>
.guest-cta__icon {
    color: rgba(var(--v-theme-on-surface), 0.3);
}
</style>
