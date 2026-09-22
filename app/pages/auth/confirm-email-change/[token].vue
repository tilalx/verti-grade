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
                <!-- ─── STEP 1 · Password ─── -->
                <div v-if="step === 'confirm'" key="confirm">
                    <v-form
                        ref="form"
                        v-model="valid"
                        data-testid="email-change-form"
                        @submit.prevent="submitChange"
                    >
                        <v-text-field
                            v-model="password"
                            :rules="passwordRules"
                            :label="$t('account.password')"
                            :type="showPassword ? 'text' : 'password'"
                            autocomplete="current-password"
                            prepend-inner-icon="mdi-lock-outline"
                            :append-inner-icon="
                                showPassword
                                    ? 'mdi-eye-off-outline'
                                    : 'mdi-eye-outline'
                            "
                            class="mb-2"
                            data-testid="email-change-password"
                            @click:append-inner="showPassword = !showPassword"
                        />
                    </v-form>

                    <v-btn
                        color="success"
                        block
                        size="large"
                        :loading="loading"
                        :disabled="loading || !valid"
                        class="mb-3 font-weight-semibold"
                        data-testid="email-change-submit"
                        @click="submitChange"
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
                    data-testid="email-change-done"
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
                        data-testid="email-change-goto-login"
                        @click="navigateTo('/auth/login')"
                    >
                        {{ $t('account.login') }}
                    </v-btn>
                </div>

                <!-- ─── STEP · Invalid / expired token ─── -->
                <div
                    v-else
                    key="invalid"
                    class="text-center py-6"
                    data-testid="email-change-invalid"
                >
                    <v-icon size="48" color="error" class="mb-4"
                        >mdi-link-off</v-icon
                    >
                    <v-btn
                        color="success"
                        variant="tonal"
                        block
                        class="mt-4"
                        data-testid="email-change-back"
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
import { required } from '~/utils/validation'

defineOptions({ name: 'ConfirmEmailChangePage' })

const { t } = useI18n()
const pb = usePocketbase()
const route = useRoute()

definePageMeta({ layout: 'blank', auth: false })

useHead({
    title: t('page.title.emailChange'),
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
const step = ref(token.value ? 'confirm' : 'invalid')

// ── State ──────────────────────────────────────────────────────────
const form = ref(null)
const valid = ref(false)
const loading = ref(false)
const password = ref('')
const showPassword = ref(false)
const passwordRules = [required(t)]

// ── Heading meta ───────────────────────────────────────────────────
const eyebrow = computed(
    () =>
        ({
            confirm: t('account.eyebrowEmailChange'),
            done: t('account.eyebrowAllDone'),
            invalid: t('account.eyebrowInvalidLink'),
        })[step.value] ?? '',
)
const title = computed(
    () =>
        ({
            confirm: t('account.emailChange'),
            done: t('account.emailChanged'),
            invalid: t('account.linkInvalid'),
        })[step.value] ?? '',
)
const subtitle = computed(
    () =>
        ({
            confirm: t('account.emailChangeHint'),
            done: t('notifications.success.emailChange'),
            invalid: t('notifications.error.emailChange'),
        })[step.value] ?? '',
)

// ── Submit ─────────────────────────────────────────────────────────
function isTokenError(err) {
    return !!err?.data?.data?.token
}

async function submitChange() {
    const { valid: formValid } = await form.value.validate()
    if (!formValid) return

    loading.value = true
    try {
        await pb
            .collection('users')
            .confirmEmailChange(token.value, password.value)
        pb.authStore.clear()
        step.value = 'done'
    } catch (err) {
        if (isTokenError(err)) {
            step.value = 'invalid'
        } else {
            const msg =
                err?.data?.message ??
                err?.message ??
                t('notifications.error.emailChange')
            notifyError(msg)
        }
    } finally {
        loading.value = false
    }
}
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
