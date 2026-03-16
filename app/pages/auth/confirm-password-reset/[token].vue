<template>
  <LayoutAuthLayout
    :org-name="orgName"
    :org-unit-name="orgUnitName"
    :loading="loading"
    :eyebrow="eyebrow"
    :title="title"
    :subtitle="subtitle"
    :heading-key="step"
    ref="layout"
  >
    <template #brand-headline>
      Reset your<br>
      account<br>
      <span class="text-success">password.</span>
    </template>

    <div style="position: relative;">
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
            rounded="lg"
            class="mb-3 font-weight-semibold"
            @click="submitReset"
          >
            {{ $t('actions.save') }}
          </v-btn>

          <v-btn
            variant="text"
            block
            rounded="lg"
            class="text-none text-medium-emphasis"
            prepend-icon="mdi-arrow-left"
            :disabled="loading"
            @click="navigateTo('/auth/login')"
          >
            {{ $t('actions.back_to_home') }}
          </v-btn>
        </div>

        <!-- ─── STEP 2 · Success ─── -->
        <div v-else-if="step === 'done'" key="done" class="text-center py-6">
          <div class="success-ring mb-6">
            <v-icon size="40" color="success">mdi-check-circle-outline</v-icon>
          </div>

          <p class="text-body-2 text-medium-emphasis mb-8">
            {{ $t('notifications.success.resetPassword') }}
          </p>

          <v-btn
            color="success"
            block
            size="large"
            rounded="lg"
            class="font-weight-semibold"
            @click="navigateTo('/auth/login')"
          >
            {{ $t('actions.back_to_home') }}
          </v-btn>
        </div>

        <!-- ─── STEP · Invalid / expired token ─── -->
        <div v-else-if="step === 'invalid'" key="invalid" class="text-center py-6">
          <v-icon size="48" color="error" class="mb-4">mdi-link-off</v-icon>
          <p class="text-body-2 text-medium-emphasis mb-8">
            {{ $t('notifications.error.resetPassword') }}
          </p>
          <v-btn
            color="success"
            variant="tonal"
            block
            rounded="lg"
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

const { t }  = useI18n()
const pb     = usePocketbase()
const route  = useRoute()

definePageMeta({ layout: 'blank', auth: false })

let _settings = null
try { _settings = await pb.collection('settings').getOne('settings_123456') } catch {}
const orgName     = _settings?.organization_name      || ''
const orgUnitName = _settings?.organization_unit_name || ''

const layout = useTemplateRef('layout')

// ── Token from URL ─────────────────────────────────────────────────
const token = computed(() => String(route.params.token ?? ''))
const step  = ref(token.value ? 'reset' : 'invalid')

// ── State ──────────────────────────────────────────────────────────
const loading         = ref(false)
const fieldsValid     = ref(false)
const newPassword     = ref('')
const confirmPassword = ref('')

// ── Heading meta ───────────────────────────────────────────────────
const eyebrow  = computed(() => ({ reset: 'ACCOUNT RECOVERY', done: 'ALL DONE', invalid: 'INVALID LINK' }[step.value] ?? ''))
const title    = computed(() => ({ reset: t('account.reset_password'), done: t('notifications.success.resetPassword'), invalid: t('notifications.error.resetPassword') }[step.value] ?? ''))
const subtitle = computed(() => ({ reset: t('account.reset_hint'), done: t('notifications.success.resetPassword'), invalid: t('notifications.error.resetPassword') }[step.value] ?? ''))

// ── Submit ─────────────────────────────────────────────────────────
function isTokenError(err) {
  return err?.data?.data?.token?.code === 'validation_invalid_token'
}

async function submitReset() {
  loading.value = true
  try {
    await pb.collection('users').confirmPasswordReset(token.value, newPassword.value, confirmPassword.value)
    step.value = 'done'
  } catch (err) {
    if (isTokenError(err)) {
      step.value = 'invalid'
    } else {
      const msg = err?.data?.message ?? err?.message ?? t('notifications.error.resetPassword')
      layout.value.notify(msg, 'error')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-swap-enter-active,
.form-swap-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; position: absolute; width: 100%; }
.form-swap-enter-from   { opacity: 0; transform: translateX(16px); }
.form-swap-leave-to     { opacity: 0; transform: translateX(-16px); }

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
