<template>
    <VApp class="fontbody">
        <NuxtLayout>
            <v-container class="error-page d-flex align-center justify-center">
                <div class="text-center" data-testid="error-page">
                    <div
                        class="error-ring"
                        :class="{ 'error-ring--danger': !isNotFound }"
                    >
                        <v-icon
                            size="40"
                            :color="isNotFound ? 'success' : 'error'"
                            :icon="
                                isNotFound
                                    ? 'mdi-map-marker-question-outline'
                                    : 'mdi-alert-circle-outline'
                            "
                        />
                    </div>

                    <div
                        class="text-label-medium text-medium-emphasis mb-2"
                        style="letter-spacing: 0.2em"
                        data-testid="error-status"
                    >
                        {{ $t('errors.eyebrow', { code: status }) }}
                    </div>

                    <div class="error-code" aria-hidden="true">
                        {{ status }}
                    </div>

                    <h1 class="text-headline-small font-weight-bold mb-2">
                        {{ title }}
                        <span v-if="isNotFound" class="d-block text-success">
                            {{ $t('errors.notFound.accent') }}
                        </span>
                    </h1>
                    <p class="text-body-medium text-medium-emphasis mb-8">
                        {{ subtitle }}
                    </p>

                    <div class="d-flex flex-wrap justify-center ga-3">
                        <v-btn
                            color="primary"
                            size="large"
                            prepend-icon="mdi-home-outline"
                            class="font-weight-semibold"
                            data-testid="error-home"
                            @click="goHome"
                        >
                            {{ $t('actions.back_to_home') }}
                        </v-btn>
                        <v-btn
                            v-if="isNotFound"
                            variant="text"
                            size="large"
                            class="text-none text-medium-emphasis"
                            prepend-icon="mdi-arrow-left"
                            data-testid="error-back"
                            @click="goBack"
                        >
                            {{ $t('errors.goBack') }}
                        </v-btn>
                        <v-btn
                            v-else
                            variant="text"
                            size="large"
                            class="text-none text-medium-emphasis"
                            prepend-icon="mdi-refresh"
                            data-testid="error-retry"
                            @click="retry"
                        >
                            {{ $t('errors.retry') }}
                        </v-btn>
                    </div>
                </div>
            </v-container>
        </NuxtLayout>
    </VApp>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const { t } = useI18n()
const router = useRouter()

const status = computed(() => props.error.status ?? 500)
const isNotFound = computed(() => status.value === 404)
const title = computed(() =>
    isNotFound.value ? t('errors.notFound.title') : t('errors.server.title'),
)
const subtitle = computed(() =>
    isNotFound.value
        ? t('errors.notFound.subtitle')
        : t('errors.server.subtitle'),
)

const goHome = () => clearError({ redirect: '/' })
const retry = () => reloadNuxtApp()
const goBack = () =>
    window.history.length > 1
        ? clearError().then(() => router.back())
        : clearError({ redirect: '/' })

useHead({
    title: computed(() =>
        isNotFound.value ? t('page.title.notFound') : title.value,
    ),
})
</script>

<style scoped>
.error-page {
    min-height: 70vh;
}

.error-ring {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 2px solid rgba(var(--v-theme-success), 0.3);
    background: rgba(var(--v-theme-success), 0.08);
    margin: 0 auto 24px;
}

.error-ring--danger {
    border-color: rgba(var(--v-theme-error), 0.3);
    background: rgba(var(--v-theme-error), 0.08);
}

.error-code {
    font-size: clamp(4.5rem, 14vw, 7.5rem);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.04em;
    margin-bottom: 16px;
    color: rgba(var(--v-theme-on-background), 0.12);
}
</style>
