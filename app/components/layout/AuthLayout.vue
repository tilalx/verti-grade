<template>
    <v-app>
        <v-main>
            <v-container fluid class="fill-height pa-0">
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
                                        >mdi-shield-lock</v-icon
                                    >
                                </v-avatar>
                                <div>
                                    <div
                                        class="text-subtitle-2 font-weight-bold text-white"
                                    >
                                        {{ orgName }}
                                    </div>
                                    <div
                                        class="text-caption text-medium-emphasis"
                                    >
                                        {{ orgUnitName }}
                                    </div>
                                </div>
                            </div>

                            <div class="brand-headline">
                                <div
                                    class="text-overline text-success mb-3"
                                    style="letter-spacing: 0.2em"
                                >
                                    ROUTE MANAGEMENT
                                </div>
                                <h1 class="brand-title text-white">
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
                                        >mdi-shield-lock</v-icon
                                    >
                                </v-avatar>
                                <div>
                                    <div class="text-body-2 font-weight-bold">
                                        {{ orgName }}
                                    </div>
                                    <div
                                        class="text-caption text-medium-emphasis"
                                    >
                                        {{ orgUnitName }}
                                    </div>
                                </div>
                            </div>

                            <!-- Heading -->
                            <Transition name="txt-swap" mode="out-in">
                                <div :key="headingKey" class="mb-8">
                                    <div
                                        class="text-overline text-medium-emphasis mb-1"
                                        style="letter-spacing: 0.18em"
                                    >
                                        {{ eyebrow }}
                                    </div>
                                    <h2 class="text-h5 font-weight-bold mb-1">
                                        {{ title }}
                                    </h2>
                                    <p class="text-body-2 text-medium-emphasis">
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

        <!-- Snackbar -->
        <v-snackbar
            v-model="snackbarVisible"
            :color="snackbarColor"
            location="top right"
            timeout="4000"
            rounded="lg"
        >
            <div class="d-flex align-center ga-2">
                <v-icon size="18">{{ snackbarIcon }}</v-icon>
                {{ snackbarMessage }}
            </div>
        </v-snackbar>
    </v-app>
</template>

<script setup>
defineOptions({ name: 'AuthLayout' })

const props = defineProps({
    orgName: { type: String, default: '' },
    orgUnitName: { type: String, default: '' },
    loading: { type: Boolean, default: false },
    eyebrow: { type: String, default: '' },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    headingKey: { type: String, default: 'heading' },
})

const snackbarVisible = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const snackbarIcon = computed(
    () =>
        ({
            success: 'mdi-check-circle-outline',
            error: 'mdi-alert-circle-outline',
            info: 'mdi-information-outline',
            warning: 'mdi-alert-outline',
        })[snackbarColor.value] ?? 'mdi-information-outline',
)

function notify(msg, color = 'success') {
    snackbarMessage.value = msg
    snackbarColor.value = color
    snackbarVisible.value = true
}

defineExpose({ notify })
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
