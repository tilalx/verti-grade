<template>
    <v-app>
        <v-main>
            <v-container class="fill-height pa-0">
                <v-row class="fill-height ma-0">
                    <!-- LEFT — Brand panel -->
                    <v-col
                        cols="12"
                        md="5"
                        class="d-none d-md-flex brand-panel pa-0"
                    >
                        <div class="brand-inner">
                            <div class="brand-logo">
                                <v-avatar
                                    size="44"
                                    rounded="lg"
                                    color="success-lighten-5"
                                    class="brand-avatar"
                                >
                                    <v-icon size="24" color="success"
                                        >mdi-shield-lock-outline</v-icon
                                    >
                                </v-avatar>
                                <div>
                                    <div
                                        class="text-title-small font-weight-bold text-high-emphasis"
                                    >
                                        {{ orgName }}
                                    </div>
                                    <div
                                        class="text-body-small text-medium-emphasis"
                                    >
                                        {{ orgUnitName }}
                                    </div>
                                </div>
                            </div>

                            <div class="brand-headline">
                                <div
                                    class="text-label-medium text-success mb-3"
                                    style="letter-spacing: 0.2em"
                                    data-testid="auth-brand-eyebrow"
                                >
                                    {{ $t('account.eyebrowBrand') }}
                                </div>
                                <h1
                                    class="brand-title text-high-emphasis"
                                    data-testid="auth-brand-title"
                                >
                                    <slot name="brand-headline" />
                                </h1>
                            </div>
                        </div>
                    </v-col>

                    <!-- RIGHT — Form panel -->
                    <v-col
                        cols="12"
                        md="7"
                        class="form-panel d-flex align-center justify-center pa-6"
                    >
                        <div class="form-wrapper">
                            <!-- Mobile logo -->
                            <div
                                class="d-flex d-md-none align-center ga-3 mb-8"
                            >
                                <v-avatar
                                    size="36"
                                    rounded="lg"
                                    color="success-lighten-5"
                                >
                                    <v-icon size="20" color="success"
                                        >mdi-shield-lock-outline</v-icon
                                    >
                                </v-avatar>
                                <div>
                                    <div
                                        class="text-body-medium font-weight-bold"
                                    >
                                        {{ orgName }}
                                    </div>
                                    <div
                                        class="text-body-small text-medium-emphasis"
                                    >
                                        {{ orgUnitName }}
                                    </div>
                                </div>
                            </div>

                            <!-- Heading -->
                            <Transition name="txt-swap" mode="out-in">
                                <div :key="headingKey" class="mb-8">
                                    <div
                                        class="text-label-medium text-medium-emphasis mb-1"
                                        style="letter-spacing: 0.18em"
                                    >
                                        {{ eyebrow }}
                                    </div>
                                    <h2
                                        class="text-headline-small font-weight-bold mb-1"
                                    >
                                        {{ title }}
                                    </h2>
                                    <p
                                        class="text-body-medium text-medium-emphasis"
                                        data-testid="auth-subtitle"
                                    >
                                        {{ subtitle }}
                                    </p>
                                </div>
                            </Transition>

                            <!-- Loading bar -->
                            <v-progress-linear
                                v-if="loading"
                                indeterminate
                                color="success"
                                height="2"
                                class="mb-6"
                                rounded
                            />

                            <slot />
                        </div>
                    </v-col>
                </v-row>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
defineOptions({ name: 'AuthLayout' })

withDefaults(
    defineProps<{
        orgName?: string
        orgUnitName?: string
        loading?: boolean
        eyebrow?: string
        title?: string
        subtitle?: string
        headingKey?: string
    }>(),
    {
        orgName: '',
        orgUnitName: '',
        loading: false,
        eyebrow: '',
        title: '',
        subtitle: '',
        headingKey: 'heading',
    },
)
</script>

<style scoped>
/* ─── Brand panel ──────────────────────────────────── */
.brand-panel {
    background: rgb(var(--v-theme-surface));
    border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    min-height: 100vh;
}

.brand-inner {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 52px 48px;
    height: 100%;
}

.brand-logo {
    display: flex;
    align-items: center;
    gap: 14px;
}

.brand-avatar {
    border: 1px solid rgba(var(--v-theme-success), 0.25);
}

.brand-headline {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 48px 0;
}

.brand-title {
    font-size: clamp(2.4rem, 3.2vw, 3.2rem);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.025em;
}

/* ─── Form panel ───────────────────────────────────── */
.form-panel {
    background: rgb(var(--v-theme-background));
    min-height: 100vh;
}

.form-wrapper {
    width: 100%;
    max-width: 420px;
}

/* ─── Transitions ──────────────────────────────────── */
.txt-swap-enter-active,
.txt-swap-leave-active {
    transition:
        opacity 0.18s ease,
        transform 0.18s ease;
}
.txt-swap-enter-from {
    opacity: 0;
    transform: translateY(8px);
}
.txt-swap-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
</style>
