<template>
  <v-container fluid>
    <v-row class="fill-height" align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card elevation="8" rounded="xl">
          <v-card-text class="py-6 px-6">
            <!-- App icon -->
            <div class="text-center mb-3">
              <v-avatar size="72" rounded>
                <v-icon size="48" color="primary">mdi-shield-lock</v-icon>
              </v-avatar>
            </div>

            <!-- Title + subtitle -->
            <div class="text-center mb-4">
              <div class="text-h5 font-weight-bold">
                {{ view === 'login' ? $t('account.login') : $t('account.reset_password') }}
              </div>
              <div class="text-medium-emphasis mt-1">
                {{
                  view === 'login'
                    ? ($t('account.login_hint') || 'Enter your credentials to continue')
                    : ($t('account.reset_hint') || 'We will email you a reset link')
                }}
              </div>
            </div>

            <!-- Progress -->
            <v-progress-linear v-if="loading" indeterminate class="mb-4" />

            <div v-if="hasAnyAuth">
              <!-- LOGIN -->
              <v-form
                v-if="view === 'login' && authMethods.password.enabled"
                ref="form"
                v-model="isValid"
                validate-on="submit"
                @submit.prevent="onSubmitLogin"
              >
                <v-text-field
                  :label="identityLabel"
                  :prepend-inner-icon="identityIcon"
                  v-model="identity"
                  :rules="identityRules"
                  :type="identityType"
                  :autocomplete="identityAutocomplete"
                  :disabled="loading"
                  density="comfortable"
                  variant="outlined"
                  autofocus
                  clearable
                  @keydown.enter.prevent="trySubmit"
                />

                <v-text-field
                  v-if="authMethods.password.enabled"
                  :label="$t('account.password')"
                  prepend-inner-icon="mdi-lock"
                  v-model="password"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  :rules="passwordRules"
                  :disabled="loading"
                  density="comfortable"
                  variant="outlined"
                  class="mt-3"
                  @click:append-inner="showPassword = !showPassword"
                  @keydown="onPasswordKeydown"
                />

                <v-alert
                  v-if="capsOn"
                  type="warning"
                  variant="tonal"
                  density="compact"
                  class="mt-2"
                  :title="$t('account.caps_lock_on') || 'Caps Lock is on'"
                />

                <v-row class="mt-2" align="center" justify="space-between" no-gutters>
                  <v-col cols="auto">
                    <v-checkbox
                      v-model="rememberMe"
                      :label="$t('account.remember_me') || 'Remember me'"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="auto">
                    <v-btn variant="text" @click="view = 'requestReset'">
                      {{ $t('account.reset_password') }}
                    </v-btn>
                  </v-col>
                </v-row>

                <v-btn
                  :loading="loading"
                  :disabled="loading"
                  color="primary"
                  type="submit"
                  block
                  class="mt-4"
                  size="large"
                >
                  {{ $t('account.login') }}
                </v-btn>

                <!-- Or with -->
                <v-row
                  v-if="authMethods.oauth2.enabled"
                  class="my-4"
                  align="center"
                  no-gutters
                >
                  <v-col>
                    <v-divider />
                  </v-col>
                  <v-col cols="auto" class="px-3 text-medium-emphasis text-caption">
                    {{ $t('account.or_login_with') }}
                  </v-col>
                  <v-col>
                    <v-divider />
                  </v-col>
                </v-row>

                <!-- OAuth providers -->
                <v-row v-if="authMethods.oauth2.enabled" dense>
                  <v-col
                    v-for="p in authMethods.oauth2.providers"
                    :key="p.name"
                    cols="12"
                    sm="6"
                    class="mb-2"
                  >
                    <v-btn
                      :title="p.displayName"
                      :disabled="loading"
                      variant="outlined"
                      block
                      @click="handleOAuthLogin(p.name)"
                    >
                      <v-icon class="mr-2">{{ providerIcons[p.name] || 'mdi-login' }}</v-icon>
                      <span class="text-truncate">{{ p.displayName }}</span>
                    </v-btn>
                  </v-col>
                </v-row>

                <v-btn variant="text" class="mt-2" block @click="navigateHome">
                  {{ $t('actions.back_to_home') }}
                </v-btn>
              </v-form>

              <!-- RESET -->
              <v-form
                v-else-if="view === 'requestReset' && authMethods.password.enabled"
                ref="resetForm"
                v-model="isResetValid"
                validate-on="submit"
                @submit.prevent="onSubmitReset"
              >
                <v-text-field
                  :label="$t('account.email')"
                  prepend-inner-icon="mdi-email"
                  v-model="resetEmail"
                  type="email"
                  autocomplete="email"
                  :disabled="loading"
                  :rules="emailOnlyRules"
                  density="comfortable"
                  variant="outlined"
                  clearable
                />

                <v-btn
                  color="primary"
                  class="mt-4"
                  block
                  size="large"
                  type="submit"
                  :loading="loading"
                  :disabled="loading"
                >
                  {{ $t('actions.submit') }}
                </v-btn>

                <v-btn variant="text" class="mt-2" block @click="view = 'login'">
                  {{ $t('actions.cancel') }}
                </v-btn>

                <v-btn variant="text" class="mt-1" block @click="navigateHome">
                  {{ $t('actions.back_to_home') }}
                </v-btn>
              </v-form>
            </div>

            <!-- No auth methods -->
            <div v-else class="text-center py-10">
              <v-icon size="48" class="mb-2">mdi-alert-circle-outline</v-icon>
              <div>{{ $t('notifications.error.no_auth_methods_available') }}</div>
            </div>

            <!-- Snackbars -->
            <v-snackbar
              v-model="snackbar"
              :color="snackbarColor"
              timeout="4000"
              location="top"
            >
              {{ snackbarMessage }}
            </v-snackbar>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>


<script setup>
const { t } = useI18n()
const pb = usePocketbase()
const router = useRouter()
const { smAndDown } = useDisplay()

useHead({
  title: t('page.title.login'),
  meta: [{ name: 'description', content: t('page.content.login'), authRequired: false }],
})

// fetch auth methods
const authMethods = await pb.collection('users').listAuthMethods()
const hasAnyAuth = authMethods && (authMethods.password?.enabled || authMethods.oauth2?.enabled)

// icons for providers
const providerIcons = {
  apple: 'mdi-apple',
  google: 'mdi-google',
  microsoft: 'mdi-microsoft',
  yandex: 'mdi-yandex',
  facebook: 'mdi-facebook',
  instagram: 'mdi-instagram',
  github: 'mdi-github',
  gitlab: 'mdi-gitlab',
  bitbucket: 'mdi-bitbucket',
  gitee: 'mdi-gitee',
  gitea: 'mdi-gitea',
  discord: 'mdi-discord',
  twitter: 'mdi-twitter',
  kakao: 'mdi-kakao',
  vk: 'mdi-vk',
  spotify: 'mdi-spotify',
  twitch: 'mdi-twitch',
  patreon: 'mdi-patreon',
  strava: 'mdi-strava',
  livechat: 'mdi-chat-processing',
  mailcow: 'mdi-email',
  planningcenter: 'mdi-calendar',
  oidc: 'mdi-lock',
  oidc2: 'mdi-lock',
  oidc3: 'mdi-lock',
}

// redirect if already logged in
if (pb.authStore.isValid) router.push('/dashboard')

// hide navbar/footer if your layout reads these
router.currentRoute.value.meta.navbar = false
router.currentRoute.value.meta.footer = false

// form/model state
const view = ref('login')
const loading = ref(false)
const isValid = ref(false)
const isResetValid = ref(false)
const identity = ref('')
const password = ref('')
const resetEmail = ref('')
const rememberMe = ref(true)
const showPassword = ref(false)
const capsOn = ref(false)

// snackbar
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('')

// identity config based on PB identity fields
const idFields = authMethods?.password?.identityFields || []
const supportsEmail = idFields.includes('email')
const supportsUsername = idFields.includes('username')

const identityLabel = computed(() => {
  if (supportsEmail && supportsUsername) return t('account.username_or_email')
  if (supportsEmail) return t('account.email')
  return t('account.username')
})
const identityType = computed(() => (supportsEmail && !supportsUsername ? 'email' : 'text'))
const identityAutocomplete = computed(() => (supportsEmail ? 'email' : 'username'))
const identityIcon = computed(() => (supportsEmail && !supportsUsername ? 'mdi-email' : 'mdi-account'))

// validation rules
const required = v => !!v || t('validations.required') || 'Required'
const isEmail = v => /.+@.+\..+/.test(String(v || '')) || (t('validations.email') || 'Invalid email')

const identityRules = computed(() => {
  if (supportsEmail && supportsUsername) return [required]
  if (supportsEmail && !supportsUsername) return [required, isEmail]
  return [required]
})
const emailOnlyRules = [required, isEmail]
const passwordRules = [required, v => (v && v.length >= 6) || (t('validations.password_min') || 'Min 6 chars')]

// handlers
async function onSubmitLogin () {
  const ok = await tryValidate(form)
  if (!ok) return
  loading.value = true
  try {
    const res = await pb.collection('users').authWithPassword(identity.value, password.value)
    if (res?.error) throw res.error
    showSnack(t('notifications.success.login'), 'success')
    router.push('/dashboard')
  } catch (e) {
    console.error('PocketBase login failed:', e)
    showSnack(resolveAuthError(e) || t('notifications.error.login_failed'), 'error')
  } finally {
    loading.value = false
  }
}

async function onSubmitReset () {
  const ok = await tryValidate(resetForm)
  if (!ok) return
  loading.value = true
  try {
    await pb.collection('users').requestPasswordReset(resetEmail.value)
    showSnack(t('notifications.success.resetPassword'), 'success')
    view.value = 'login'
  } catch (e) {
    console.error('Reset request failed:', e)
    showSnack(resolveAuthError(e) || t('notifications.error.resetPassword'), 'error')
  } finally {
    loading.value = false
  }
}

function handleOAuthLogin (provider) {
  loading.value = true
  pb.collection('users').authWithOAuth2({ provider })
    .then(res => {
      if (res?.error) throw res.error
      showSnack(t('notifications.success.login'), 'success')
      router.push('/dashboard')
    })
    .catch(e => {
      console.error('OAuth login failed:', e)
      showSnack(resolveAuthError(e) || t('notifications.error.login_failed'), 'error')
    })
    .finally(() => (loading.value = false))
}

function navigateHome () { router.push('/') }

function showSnack (msg, color) {
  snackbarMessage.value = msg
  snackbarColor.value = color
  snackbar.value = true
}

function resolveAuthError (e) {
  const msg = e?.data?.message || e?.message || ''
  if (/invalid.+credentials/i.test(msg)) return t('notifications.error.invalid_credentials') || 'Invalid credentials'
  if (/not verified/i.test(msg)) return t('notifications.error.email_not_verified') || 'Email not verified'
  if (/too many/i.test(msg)) return t('notifications.error.too_many_attempts') || 'Too many attempts'
  return msg
}

// caps lock detection
function onPasswordKeydown (ev) {
  if (typeof ev.getModifierState === 'function') {
    capsOn.value = ev.getModifierState('CapsLock')
  }
}

// form refs + helpers
const form = ref()
const resetForm = ref()
async function tryValidate (formRef) {
  const f = formRef?.value
  if (!f) return true
  const { valid } = await f.validate()
  return valid
}
function trySubmit () {
  if (view.value === 'login') onSubmitLogin()
}

// focus first field on view change
watch(view, () => {
  nextTick(() => {
    const el = document.querySelector('input')
    if (el) el.focus()
  })
})
</script>
