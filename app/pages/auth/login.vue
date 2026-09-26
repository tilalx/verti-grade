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
                        v-if="canRegister"
                        variant="tonal"
                        block
                        class="text-none mb-3"
                        :disabled="loading"
                        data-testid="login-goto-register"
                        @click="view = 'register'"
                    >
                        {{ $t('account.createAccount') }}
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

                <v-form
                    v-else-if="view === 'register'"
                    key="register"
                    ref="registerForm"
                    validate-on="submit"
                    data-testid="register-form"
                    @submit.prevent="submitRegister"
                >
                    <v-text-field
                        v-model="registerUsername"
                        :label="$t('account.username')"
                        prepend-inner-icon="mdi-account-outline"
                        autocomplete="username"
                        :rules="usernameRules"
                        :disabled="loading"
                        color="success"
                        class="mb-2"
                        data-testid="register-username"
                        autofocus
                    />
                    <v-text-field
                        v-model="registerEmail"
                        :label="$t('account.email')"
                        prepend-inner-icon="mdi-email-outline"
                        type="email"
                        autocomplete="email"
                        :rules="emailRules"
                        :disabled="loading"
                        color="success"
                        class="mb-2"
                        data-testid="register-email"
                    />
                    <UserPasswordChangeFields
                        v-model:password="registerPassword"
                        v-model:password-confirm="registerPasswordConfirm"
                        :require-old-password="false"
                    />

                    <v-btn
                        type="submit"
                        color="primary"
                        block
                        size="large"
                        :loading="loading"
                        :disabled="loading"
                        class="mt-2 mb-3 font-weight-semibold"
                        data-testid="register-submit"
                    >
                        <template #loader><CaptchaLoader /></template>
                        {{ $t('account.createAccount') }}
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

<script setup lang="ts">
import type { Ref } from 'vue'
import type { VForm } from 'vuetify/components'
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

const { orgName, orgUnitName, allowRegistration } = useOrgSettings()
const canRegister = computed(
    () => allowRegistration.value && !!authMethods?.password?.enabled,
)

// ── State ──────────────────────────────────────────────────────────
const { notify, error: notifyError } = useNotification()
const view = ref('login')
const loading = ref(false)
const loginValid = ref(false)
const resetValid = ref(false)
const identity = ref('')
const password = ref('')
const resetEmail = ref('')
const registerUsername = ref('')
const registerEmail = ref('')
const registerPassword = ref('')
const registerPasswordConfirm = ref('')
const rememberMe = ref(true)
const showPassword = ref(false)
const capsLockOn = ref(false)

const loginForm = useTemplateRef<VForm>('loginForm')
const resetForm = useTemplateRef<VForm>('resetForm')
const registerForm = useTemplateRef<VForm>('registerForm')

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
            register: t('account.eyebrowRegister'),
        })[view.value] ?? '',
)
const viewTitle = computed(
    () =>
        ({
            login: t('account.login'),
            requestReset: t('account.reset_password'),
            register: t('account.createAccount'),
        })[view.value] ?? '',
)
const viewSubtitle = computed(
    () =>
        ({
            login: t('account.login_hint'),
            requestReset: t('account.reset_hint'),
            register: t('account.register_hint'),
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
const usernameRules = [
    required(t),
    minLength(t, 3),
    (value: string) =>
        /^[\w][\w.-]*$/.test(value) || t('account.usernameInvalid'),
]

// ── OAuth icons ────────────────────────────────────────────────────
const PROVIDER_ICONS: Record<string, string> = {
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
const providerIcon = (name: string) => PROVIDER_ICONS[name] ?? 'mdi-login'

// ── Helpers ────────────────────────────────────────────────────────
async function validate(form: Readonly<Ref<VForm | null>>) {
    if (!form.value) return true
    const { valid } = await form.value.validate()
    return valid
}

function detectCapsLock(ev: KeyboardEvent) {
    if (typeof ev.getModifierState === 'function')
        capsLockOn.value = ev.getModifierState('CapsLock')
}

watch(view, async () => {
    await nextTick()
    document.querySelector('input')?.focus()
})

function resolveAuthError(err: unknown) {
    const { data, message } = (err ?? {}) as {
        data?: { message?: string }
        message?: string
    }
    const msg = data?.message ?? message ?? ''
    if (/invalid.+credentials/i.test(msg))
        return t('notifications.error.invalid_credentials')
    if (/not verified/i.test(msg))
        return t('notifications.error.email_not_verified')
    if (/too many/i.test(msg)) return t('notifications.error.too_many_attempts')
    if (/captcha/i.test(msg)) return t('notifications.error.captcha')
    return t('notifications.error.unknown')
}

// ── Auth handlers ──────────────────────────────────────────────────
async function submitLogin() {
    if (!(await validate(loginForm))) return
    loading.value = true
    try {
        await pb
            .collection('users')
            .authWithPassword(identity.value, password.value, {
                headers: await capHeaders('login'),
            })
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

function resolveRegisterError(err: unknown) {
    const fields = (
        err as { data?: { data?: Record<string, { code?: string }> } }
    )?.data?.data
    if (fields?.username?.code === 'validation_not_unique')
        return t('users.usernameTaken')
    if (fields?.email) return t('account.emailTaken')
    return resolveAuthError(err)
}

async function submitRegister() {
    if (!(await validate(registerForm))) return
    loading.value = true
    try {
        await pb.collection('users').create(
            {
                username: registerUsername.value,
                email: registerEmail.value,
                password: registerPassword.value,
                passwordConfirm: registerPasswordConfirm.value,
            },
            { headers: await capHeaders('register') },
        )
        await pb
            .collection('users')
            .requestVerification(registerEmail.value)
            .catch(() => {})
        notify(t('notifications.success.registered'))
        identity.value = registerUsername.value
        registerPassword.value = registerPasswordConfirm.value = ''
        view.value = 'login'
    } catch (err) {
        notifyError(resolveRegisterError(err))
    } finally {
        loading.value = false
    }
}

async function loginWithOAuth(provider: string) {
    loading.value = true
    try {
        await pb.collection('users').authWithOAuth2({ provider })
        await navigateTo('/manage/routes', { replace: true })
    } catch (err) {
        notifyError(resolveAuthError(err))
    } finally {
        loading.value = false
    }
}
</script>
