<template>
    <LayoutAuthLayout
        :org-name="orgName"
        :org-unit-name="orgUnitName"
        :loading="loading"
        :eyebrow="heading.eyebrow"
        :title="heading.title"
        :subtitle="heading.subtitle"
        :heading-key="step"
    >
        <template #brand-headline>
            {{ $t(`account.brandHeadline.${brandHeadline}.l1`) }}<br />
            {{ $t(`account.brandHeadline.${brandHeadline}.l2`) }}<br />
            <span class="text-success">{{
                $t(`account.brandHeadline.${brandHeadline}.accent`)
            }}</span>
        </template>

        <div style="position: relative">
            <Transition name="form-swap" mode="out-in">
                <div
                    v-if="step === 'form' && auto"
                    key="pending"
                    class="text-center py-6"
                    :data-testid="`${testidPrefix}-pending`"
                >
                    <v-progress-circular
                        indeterminate
                        color="success"
                        size="48"
                        class="mb-6"
                    />
                </div>

                <div v-else-if="step === 'form'" key="form">
                    <slot :submit="submit" :loading="loading" />

                    <v-btn
                        variant="text"
                        block
                        class="text-none text-medium-emphasis"
                        prepend-icon="mdi-arrow-left"
                        :disabled="loading"
                        @click="navigateTo('/auth/login')"
                    >
                        {{ $t('actions.back_to_home') }}
                    </v-btn>
                </div>

                <div
                    v-else-if="step === 'done'"
                    key="done"
                    class="text-center py-6"
                    :data-testid="`${testidPrefix}-done`"
                >
                    <div class="success-ring">
                        <v-icon size="40" color="success"
                            >mdi-check-circle-outline</v-icon
                        >
                    </div>

                    <v-btn
                        color="success"
                        block
                        size="large"
                        class="font-weight-semibold"
                        :data-testid="`${testidPrefix}-goto-login`"
                        @click="navigateTo('/auth/login')"
                    >
                        {{ $t('account.login') }}
                    </v-btn>
                </div>

                <div
                    v-else
                    key="invalid"
                    class="text-center py-6"
                    :data-testid="`${testidPrefix}-invalid`"
                >
                    <v-icon size="48" color="error" class="mb-4"
                        >mdi-link-off</v-icon
                    >
                    <v-btn
                        color="success"
                        variant="tonal"
                        block
                        class="mt-4"
                        :data-testid="`${testidPrefix}-back`"
                        @click="navigateTo('/auth/login')"
                    >
                        {{ $t('actions.back_to_home') }}
                    </v-btn>
                </div>
            </Transition>
        </div>
    </LayoutAuthLayout>
</template>

<script setup lang="ts">
type Step = 'form' | 'done' | 'invalid'

interface Heading {
    eyebrow: string
    title: string
    subtitle: string
}

const props = withDefaults(
    defineProps<{
        testidPrefix: string
        brandHeadline: 'login' | 'reset'
        formHeading: Heading
        doneTitle: string
        doneSubtitle: string
        invalidSubtitle: string
        action: (token: string) => Promise<unknown>
        auto?: boolean
        isTokenError?: (error: unknown) => boolean
        errorMessage?: string
    }>(),
    {
        auto: false,
        isTokenError: () => true,
        errorMessage: '',
    },
)

const { t } = useI18n()
const route = useRoute()
const { orgName, orgUnitName } = useOrgSettings()
const { error: notifyError } = useNotification()

const token = String(route.params.token ?? '')
const step = ref<Step>(token ? 'form' : 'invalid')
const submitting = ref(false)
const loading = computed(
    () => submitting.value || (props.auto && step.value === 'form'),
)

const heading = computed<Heading>(() => {
    if (step.value === 'done') {
        return {
            eyebrow: t('account.eyebrowAllDone'),
            title: props.doneTitle,
            subtitle: props.doneSubtitle,
        }
    }
    if (step.value === 'invalid') {
        return {
            eyebrow: t('account.eyebrowInvalidLink'),
            title: t('account.linkInvalid'),
            subtitle: props.invalidSubtitle,
        }
    }
    return props.formHeading
})

function errorText(error: unknown) {
    const { data, message } = (error ?? {}) as {
        data?: { message?: string }
        message?: string
    }
    return data?.message ?? message ?? props.errorMessage
}

async function submit() {
    submitting.value = true
    try {
        await props.action(token)
        step.value = 'done'
    } catch (error) {
        if (props.isTokenError(error)) step.value = 'invalid'
        else notifyError(errorText(error))
    } finally {
        submitting.value = false
    }
}

onMounted(() => {
    if (props.auto && token) void submit()
})
</script>

<style scoped>
.success-ring {
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
</style>
