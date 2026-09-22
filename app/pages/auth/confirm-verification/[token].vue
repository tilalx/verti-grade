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
            {{ $t('account.brandHeadline.login.l1') }}<br />
            {{ $t('account.brandHeadline.login.l2') }}<br />
            <span class="text-success">{{
                $t('account.brandHeadline.login.accent')
            }}</span>
        </template>

        <div style="position: relative">
            <Transition name="form-swap" mode="out-in">
                <!-- ─── STEP 1 · Working ─── -->
                <div
                    v-if="step === 'verifying'"
                    key="verifying"
                    class="text-center py-6"
                    data-testid="verify-pending"
                >
                    <v-progress-circular
                        indeterminate
                        color="success"
                        size="48"
                        class="mb-6"
                    />
                </div>

                <!-- ─── STEP 2 · Success ─── -->
                <div
                    v-else-if="step === 'done'"
                    key="done"
                    class="text-center py-6"
                    data-testid="verify-done"
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
                        data-testid="verify-goto-login"
                        @click="navigateTo('/auth/login')"
                    >
                        {{ $t('account.login') }}
                    </v-btn>
                </div>

                <!-- ─── STEP · Invalid / expired token ─── -->
                <div
                    v-else-if="step === 'invalid'"
                    key="invalid"
                    class="text-center py-6"
                    data-testid="verify-invalid"
                >
                    <v-icon size="48" color="error" class="mb-4"
                        >mdi-link-off</v-icon
                    >
                    <v-btn
                        color="success"
                        variant="tonal"
                        block
                        class="mt-4"
                        data-testid="verify-back"
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
defineOptions({ name: 'ConfirmVerificationPage' })

const { t } = useI18n()
const pb = usePocketbase()
const route = useRoute()

definePageMeta({ layout: 'blank', auth: false })

useHead({
    title: t('page.title.verifyEmail'),
})

let _settings = null
try {
    _settings = await pb.collection('settings').getOne('settings_123456')
} catch {}
const orgName = _settings?.organization_name || ''
const orgUnitName = _settings?.organization_unit_name || ''

// ── Token from URL ─────────────────────────────────────────────────
const token = computed(() => String(route.params.token ?? ''))
const step = ref(token.value ? 'verifying' : 'invalid')
const loading = computed(() => step.value === 'verifying')

// ── Heading meta ───────────────────────────────────────────────────
const eyebrow = computed(
    () =>
        ({
            verifying: t('account.eyebrowVerifyEmail'),
            done: t('account.eyebrowAllDone'),
            invalid: t('account.eyebrowInvalidLink'),
        })[step.value] ?? '',
)
const title = computed(
    () =>
        ({
            verifying: t('account.verifyEmail'),
            done: t('account.emailVerified'),
            invalid: t('account.linkInvalid'),
        })[step.value] ?? '',
)
const subtitle = computed(
    () =>
        ({
            verifying: t('account.verifyEmailHint'),
            done: t('notifications.success.verifyEmail'),
            invalid: t('notifications.error.verifyEmail'),
        })[step.value] ?? '',
)

// ── Confirm ────────────────────────────────────────────────────────
// No form to fill in: the token is the whole request, so it runs on mount.
// Client-only -- SSR would burn the single-use token on a prefetch.
onMounted(async () => {
    if (!token.value) return
    try {
        await pb.collection('users').confirmVerification(token.value)
        step.value = 'done'
    } catch {
        // Any failure here is a dead link as far as the user is concerned:
        // expired, already consumed, or malformed.
        step.value = 'invalid'
    }
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
    /* Vuetify 4 spacing utilities live in a CSS layer, so this unlayered
       scoped rule wins over an mb-* class on the same element -- the gap has
       to be declared here or the ring sits flush against the button. */
    margin: 0 auto 24px;
}
</style>
