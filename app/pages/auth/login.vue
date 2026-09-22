<template>
    <LayoutAuthLayout
        :org-name="orgName"
        :org-unit-name="orgUnitName"
        :loading="loading"
        :eyebrow="viewEyebrow"
        :title="viewTitle"
        :subtitle="viewSubtitle"
        :heading-key="view"
    >
        <template #brand-headline>
            {{ $t('account.brandHeadline.login.l1') }}<br />
            {{ $t('account.brandHeadline.login.l2') }}<br />
            <span class="text-success">{{
                $t('account.brandHeadline.login.accent')
            }}</span>
        </template>

        <div v-if="!hasAnyAuth" class="text-center py-10">
            <v-icon size="48" color="warning" class="mb-3"
                >mdi-alert-circle-outline</v-icon
            >
            <p class="text-body-medium text-medium-emphasis">
                {{ $t('notifications.error.no_auth_methods_available') }}
            </p>
        </div>

        <div v-else style="position: relative">
            <Transition name="form-swap" mode="out-in">
                <!-- ─── LOGIN ─── -->
                <v-form
                    v-if="view === 'login'"
                    key="login"
                    ref="loginForm"
                    v-model="loginValid"
                    validate-on="submit"
                    data-testid="login-form"
                    @submit.prevent="submitLogin"
                >
                    <v-text-field
                        v-model="identity"
                        :label="identityLabel"
                        :prepend-inner-icon="identityIcon"
                        :type="identityInputType"
                        :autocomplete="identityAutocomplete"
                        :name="identityAutocomplete"
                        :rules="identityRules"
                        :disabled="loading"
                        color="success"
                        class="mb-2"
                        data-testid="login-identity"
                        autofocus
                        clearable
                        @keydown.enter.prevent="submitLogin"
                    />

                    <v-text-field
                        v-if="authMethods.password?.enabled"
                        v-model="password"
                        :label="$t('account.password')"
                        :type="showPassword ? 'text' : 'password'"
                        :append-inner-icon="
                            showPassword
                                ? 'mdi-eye-off-outline'
                                : 'mdi-eye-outline'
                        "
                        prepend-inner-icon="mdi-lock-outline"
                        autocomplete="current-password"
                        name="password"
                        data-testid="login-password"
                        :rules="passwordRules"
                        :disabled="loading"
                        color="success"
                        class="mb-1"
                        @click:append-inner="showPassword = !showPassword"
                        @keydown="detectCapsLock"
                        @keydown.enter.prevent="submitLogin"
                    />

                    <v-alert
                        v-if="capsLockOn"
                        type="warning"
                        class="mb-3"
                        :text="$t('account.capsLockOn')"
                    />

                    <div class="d-flex align-center justify-space-between mb-5">
                        <v-checkbox
                            v-model="rememberMe"
                            :label="$t('account.remember_me')"
                            color="success"
                            density="compact"
                            hide-details
                        />
                        <v-btn
                            variant="text"
                            color="primary"
                            size="small"
                            class="text-none"
                            data-testid="login-goto-reset"
                            @click="view = 'requestReset'"
                        >
                            {{ $t('account.reset_password') }}
                        </v-btn>
                    </div>

                    <v-btn
                        type="submit"
                        color="primary"
                        block
                        size="large"
                        :loading="loading"
                        :disabled="loading"
                        class="mb-3 font-weight-semibold"
                        data-testid="login-submit"
                    >
                        <template #loader><CaptchaLoader /></template>
                        {{ $t('account.login') }}
                    </v-btn>

                    <v-btn
                        variant="text"
                        block
                        class="text-none text-medium-emphasis mb-1"
                        prepend-icon="mdi-arrow-left"
                        :disabled="loading"
                        @click="navigateTo('/')"
                    >
                        {{ $t('actions.back_to_home') }}
                    </v-btn>

                    <!-- OAuth -->
                    <template v-if="authMethods.oauth2?.enabled">
                        <div class="d-flex align-center ga-3 my-4">
                            <v-divider />
                            <span
                                class="text-body-small text-medium-emphasis text-no-wrap"
                            >
                                {{ $t('account.or_login_with') }}
                            </span>
                            <v-divider />
                        </div>

                        <v-row density="comfortable">
                            <v-col
                                v-for="p in authMethods.oauth2.providers"
                                :key="p.name"
                                cols="12"
                                sm="6"
                            >
                                <v-btn
                                    :disabled="loading"
                                    variant="outlined"
                                    block
                                    class="text-none"
                                    @click="loginWithOAuth(p.name)"
                                >
                                    <v-icon start size="16">{{
                                        providerIcon(p.name)
                                    }}</v-icon>
                                    {{ p.displayName }}
                                </v-btn>
                            </v-col>
                        </v-row>
                    </template>
                </v-form>

                <!-- ─── RESET ─── -->
                <v-form
                    v-else-if="view === 'requestReset'"
                    key="requestReset"
                    ref="resetForm"
                    v-model="resetValid"
                    validate-on="submit"
                    data-testid="reset-form"
                    @submit.prevent="submitReset"
                >
                    <v-alert
                        type="info"
                        color="success"
                        icon="mdi-email-outline"
                        class="mb-6"
                        :text="$t('account.resetInfo')"
                    />

                    <v-text-field
                        v-model="resetEmail"
                        :label="$t('account.email')"
                        prepend-inner-icon="mdi-email-outline"
                        type="email"
                        autocomplete="email"
                        :rules="emailRules"
                        :disabled="loading"
                        color="success"
                        class="mb-5"
                        data-testid="reset-email"
                        autofocus
                        clearable
                    />

                    <v-btn
                        type="submit"
                        color="primary"
                        block
                        size="large"
                        :loading="loading"
                        :disabled="loading"
                        class="mb-3 font-weight-semibold"
                        data-testid="reset-submit"
                    >
                        <template #loader><CaptchaLoader /></template>
                        {{ $t('actions.submit') }}
                    </v-btn>

                    <v-btn
                        variant="text"
                        block
                        :disabled="loading"
                        class="text-none text-medium-emphasis"
                        @click="view = 'login'"
                    >
                        {{ $t('actions.cancel') }}
                    </v-btn>
                </v-form>
            </Transition>
        </div>
    </LayoutAuthLayout>
</template>

<script setup>
import { required, validEmail, minLength } from '~/utils/validation'
defineOptions({ name: 'LoginPage' })

const { t } = useI18n()
const pb = usePocketbase()
const { capHeaders } = useCapToken()

definePageMeta({ layout: 'blank', auth: false })

useHead({
    title: t('page.title.login'),
})

if (pb.authStore.isValid) {
    try {
        await pb.collection('users').authRefresh()
        await navigateTo('/manage/routes', { replace: true })
    } catch {
        pb.authStore.clear()
    }
}

const authMethods = await pb.collection('users').listAuthMethods()
const hasAnyAuth = !!(
    authMethods?.password?.enabled || authMethods?.oauth2?.enabled
)

let _settings = null
try {
    _settings = await pb.collection('settings').getOne('settings_123456')
} catch {}
const orgName = _settings?.organization_name || ''
const orgUnitName = _settings?.organization_unit_name || ''

// ── State ──────────────────────────────────────────────────────────
const { notify, error: notifyError } = useNotification()
const view = ref('login')
const loading = ref(false)
const loginValid = ref(false)
const resetValid = ref(false)
const identity = ref('')
const password = ref('')
const resetEmail = ref('')
const rememberMe = ref(true)
const showPassword = ref(false)
const capsLockOn = ref(false)

const loginForm = useTemplateRef('loginForm')
const resetForm = useTemplateRef('resetForm')

// ── Identity config ────────────────────────────────────────────────
const idFields = authMethods?.password?.identityFields ?? []
const supportsEmail = idFields.includes('email')
const supportsUser = idFields.includes('username')

const identityLabel = computed(() =>
    supportsEmail && supportsUser
        ? t('account.username_or_email')
        : supportsEmail
          ? t('account.email')
          : t('account.username'),
)
const identityInputType = computed(() =>
    supportsEmail && !supportsUser ? 'email' : 'text',
)
const identityAutocomplete = computed(() =>
    supportsEmail ? 'email' : 'username',
)
const identityIcon = computed(() =>
    supportsEmail && !supportsUser
        ? 'mdi-email-outline'
        : 'mdi-account-outline',
)

// ── View meta ──────────────────────────────────────────────────────
const viewEyebrow = computed(
    () =>
        ({
            login: t('account.eyebrowWelcomeBack'),
            requestReset: t('account.eyebrowAccountRecovery'),
        })[view.value] ?? '',
)
const viewTitle = computed(
    () =>
        ({
            login: t('account.login'),
            requestReset: t('account.reset_password'),
        })[view.value] ?? '',
)
const viewSubtitle = computed(
    () =>
        ({
            login: t('account.login_hint'),
            requestReset: t('account.reset_hint'),
        })[view.value] ?? '',
)

// ── Validation ─────────────────────────────────────────────────────
const identityRules = computed(() => {
    const r = [required(t)]
    if (supportsEmail && !supportsUser) r.push(validEmail(t))
    return r
})
const passwordRules = [required(t), minLength(t, 6)]
const emailRules = [required(t), validEmail(t)]

// ── OAuth icons ────────────────────────────────────────────────────
const PROVIDER_ICONS = {
    apple: 'mdi-apple',
    google: 'mdi-google',
    microsoft: 'mdi-microsoft',
    facebook: 'mdi-facebook',
    github: 'mdi-github',
    gitlab: 'mdi-gitlab',
    discord: 'mdi-discord',
    twitter: 'mdi-twitter',
    spotify: 'mdi-spotify',
    twitch: 'mdi-twitch',
    bitbucket: 'mdi-bitbucket',
    oidc: 'mdi-lock-outline',
    oidc2: 'mdi-lock-outline',
    oidc3: 'mdi-lock-outline',
}
const providerIcon = (name) => PROVIDER_ICONS[name] ?? 'mdi-login'

// ── Helpers ────────────────────────────────────────────────────────
async function validate(ref) {
    const f = ref?.value
    if (!f) return true
    const { valid } = await f.validate()
    return valid
}

function detectCapsLock(ev) {
    if (typeof ev.getModifierState === 'function')
        capsLockOn.value = ev.getModifierState('CapsLock')
}

watch(view, async () => {
    await nextTick()
    document.querySelector('input')?.focus()
})

function resolveAuthError(err) {
    const msg = err?.data?.message ?? err?.message ?? ''
    if (/invalid.+credentials/i.test(msg))
        return t('notifications.error.invalid_credentials')
    if (/not verified/i.test(msg))
        return t('notifications.error.email_not_verified')
    if (/too many/i.test(msg)) return t('notifications.error.too_many_attempts')
    return msg || t('notifications.error.unknown')
}

// ── Auth handlers ──────────────────────────────────────────────────
async function submitLogin() {
    if (!(await validate(loginForm))) return
    loading.value = true
    try {
        // No autoRefreshThreshold: the SDK only honours it on _superusers, so
        // on this collection it was never an option -- just an unknown key the
        // SDK forwarded as a ?autoRefreshThreshold=0 query param.
        // A sign-in is the one anonymous action that is worth guessing at, so
        // PocketBase wants a solved captcha here too when one is configured.
        // The superuser panel at /_/ is deliberately not gated -- it cannot
        // attach a token -- and relies on the rate limit instead.
        await pb
            .collection('users')
            .authWithPassword(identity.value, password.value, {
                headers: await capHeaders('login'),
            })
        // No success toast: the redirect is the confirmation, and a snackbar
        // riding along into the next page just gets in the way.
        await navigateTo('/manage/routes', { replace: true })
    } catch (err) {
        notifyError(resolveAuthError(err))
    } finally {
        loading.value = false
    }
}

async function submitReset() {
    if (!(await validate(resetForm))) return
    loading.value = true
    try {
        await pb.collection('users').requestPasswordReset(resetEmail.value, {
            headers: await capHeaders('password-reset'),
        })
        notify(t('notifications.success.resetPassword'))
        view.value = 'login'
        resetEmail.value = ''
    } catch (err) {
        notifyError(resolveAuthError(err))
    } finally {
        loading.value = false
    }
}

async function loginWithOAuth(provider) {
    loading.value = true
    try {
        await pb.collection('users').authWithOAuth2({ provider })
        // No success toast: the redirect is the confirmation, and a snackbar
        // riding along into the next page just gets in the way.
        await navigateTo('/manage/routes', { replace: true })
    } catch (err) {
        notifyError(resolveAuthError(err))
    } finally {
        loading.value = false
    }
}
</script>
