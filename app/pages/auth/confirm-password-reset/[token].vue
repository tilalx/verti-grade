<template>
    <LayoutAuthLayout
        :org-name="orgName"
        :org-unit-name="orgUnitName"
        :loading="loading"
        :eyebrow="eyebrow"
        :title="title"
        :subtitle="subtitle"
        :heading-key="step"
    >
        <template #brand-headline>
            {{ $t('account.brandHeadline.reset.l1') }}<br />
            {{ $t('account.brandHeadline.reset.l2') }}<br />
            <span class="text-success">{{
                $t('account.brandHeadline.reset.accent')
            }}</span>
        </template>

        <div style="position: relative">
            <Transition name="form-swap" mode="out-in">
                <!-- ─── STEP 1 · New password ─── -->
                <div v-if="step === 'reset'" key="reset">
                    <UserPasswordChangeFields
                        v-model:password="newPassword"
                        v-model:password-confirm="confirmPassword"
                        :require-old-password="false"
                        @validity="fieldsValid = $event"
                    />

                    <v-btn
                        color="success"
                        block
                        size="large"
                        :loading="loading"
                        :disabled="loading || !fieldsValid"
                        class="mb-3 font-weight-semibold"
                        data-testid="confirm-reset-submit"
                        @click="submitReset"
                    >
                        {{ $t('actions.save') }}
                    </v-btn>

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

                <!-- ─── STEP 2 · Success ─── -->
                <div
                    v-else-if="step === 'done'"
                    key="done"
                    class="text-center py-6"
                    data-testid="reset-done"
                >
                    <div class="success-ring mb-6">
                        <v-icon size="40" color="success"
                            >mdi-check-circle-outline</v-icon
                        >
                    </div>

                    <p class="text-body-medium text-medium-emphasis mb-8">
                        {{ $t('notifications.success.resetPassword') }}
                    </p>

                    <v-btn
                        color="success"
                        block
                        size="large"
                        class="font-weight-semibold"
                        @click="navigateTo('/auth/login')"
                    >
                        {{ $t('actions.back_to_home') }}
                    </v-btn>
                </div>

                <!-- ─── STEP · Invalid / expired token ─── -->
                <div
                    v-else-if="step === 'invalid'"
                    key="invalid"
                    class="text-center py-6"
                    data-testid="reset-invalid"
                >
                    <v-icon size="48" color="error" class="mb-4"
                        >mdi-link-off</v-icon
                    >
                    <p class="text-body-medium text-medium-emphasis mb-8">
                        {{ $t('notifications.error.resetPassword') }}
                    </p>
                    <v-btn
                        color="success"
                        variant="tonal"
                        block
                        @click="navigateTo('/auth/login')"
                    >
                        {{ $t('actions.back_to_home') }}
                    </v-btn>
                </div>
            </Transition>
        </div>
    </LayoutAuthLayout>
</template>

<script setup>
defineOptions({ name: 'ResetPasswordPage' })

const { t } = useI18n()
const pb = usePocketbase()
const route = useRoute()

definePageMeta({ layout: 'blank', auth: false })

useHead({
    title: t('page.title.resetPassword'),
})

let _settings = null
try {
    _settings = await pb.collection('settings').getOne('settings_123456')
} catch {}
const orgName = _settings?.organization_name || ''
const orgUnitName = _settings?.organization_unit_name || ''

const { error: notifyError } = useNotification()

// ── Token from URL ─────────────────────────────────────────────────
const token = computed(() => String(route.params.token ?? ''))
const step = ref(token.value ? 'reset' : 'invalid')

// ── State ──────────────────────────────────────────────────────────
const loading = ref(false)
const fieldsValid = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')

// ── Heading meta ───────────────────────────────────────────────────
const eyebrow = computed(
    () =>
        ({
            reset: t('account.eyebrowAccountRecovery'),
            done: t('account.eyebrowAllDone'),
            invalid: t('account.eyebrowInvalidLink'),
        })[step.value] ?? '',
)
const title = computed(
    () =>
        ({
            reset: t('account.reset_password'),
            done: t('notifications.success.resetPassword'),
            invalid: t('notifications.error.resetPassword'),
        })[step.value] ?? '',
)
const subtitle = computed(
    () =>
        ({
            reset: t('account.reset_hint'),
            done: t('notifications.success.resetPassword'),
            invalid: t('notifications.error.resetPassword'),
        })[step.value] ?? '',
)

// ── Submit ─────────────────────────────────────────────────────────
function isTokenError(err) {
    return err?.data?.data?.token?.code === 'validation_invalid_token'
}

async function submitReset() {
    loading.value = true
    try {
        await pb
            .collection('users')
            .confirmPasswordReset(
                token.value,
                newPassword.value,
                confirmPassword.value,
            )
        step.value = 'done'
    } catch (err) {
        if (isTokenError(err)) {
            step.value = 'invalid'
        } else {
            const msg =
                err?.data?.message ??
                err?.message ??
                t('notifications.error.resetPassword')
            notifyError(msg)
        }
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.success-ring {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 2px solid rgba(var(--v-theme-success), 0.3);
    background: rgba(var(--v-theme-success), 0.08);
    margin: 0 auto;
}
</style>
