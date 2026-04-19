<template>
    <LayoutAuthLayout
        :org-name="orgName"
        :org-unit-name="orgUnitName"
        :loading="loading"
        :eyebrow="viewEyebrow"
        :title="viewTitle"
        :subtitle="viewSubtitle"
        :heading-key="view"
        ref="layout"
    >
        <template #brand-headline>
            Manage your<br />
            climbing<br />
            <span class="text-success">routes.</span>
        </template>

        <div v-if="!hasAnyAuth" class="text-center py-10">
            <v-icon size="48" color="warning" class="mb-3"
                >mdi-alert-circle-outline</v-icon
            >
            <p class="text-body-2 text-medium-emphasis">
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
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        class="mb-2"
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
                            showPassword ? 'mdi-eye-off' : 'mdi-eye'
                        "
                        prepend-inner-icon="mdi-lock-outline"
                        autocomplete="current-password"
                        name="password"
                        :rules="passwordRules"
                        :disabled="loading"
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        class="mb-1"
                        @click:append-inner="showPassword = !showPassword"
                        @keydown="detectCapsLock"
                        @keydown.enter.prevent="submitLogin"
                    />

                    <v-alert
                        v-if="capsLockOn"
                        type="warning"
                        variant="tonal"
                        density="compact"
                        rounded="lg"
                        class="mb-3"
                        text="Caps Lock is on"
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
                        rounded="lg"
                        class="mb-3 font-weight-semibold"
                    >
                        {{ $t('account.login') }}
                    </v-btn>

                    <v-btn
                        variant="text"
                        block
                        rounded="lg"
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
                                class="text-caption text-medium-emphasis text-no-wrap"
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
                                    rounded="lg"
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
                    @submit.prevent="submitReset"
                >
                    <v-alert
                        type="info"
                        variant="tonal"
                        color="success"
                        rounded="lg"
                        density="compact"
                        icon="mdi-email-outline"
                        class="mb-6"
                        text="We'll send a password reset link to your email address."
                    />

                    <v-text-field
                        v-model="resetEmail"
                        :label="$t('account.email')"
                        prepend-inner-icon="mdi-email-outline"
                        type="email"
                        autocomplete="email"
                        :rules="emailRules"
                        :disabled="loading"
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        class="mb-5"
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
                        rounded="lg"
                        class="mb-3 font-weight-semibold"
                    >
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

definePageMeta({ layout: 'blank', auth: false })

if (pb.authStore.isValid) {
    try {
        await pb.collection('users').authRefresh()
        await navigateTo('/admin/routes', { replace: true })
    } catch {
        pb.authStore.clear()
    }
}

const authMethods = await pb.collection('users').listAuthMethods()
const hasAnyAuth = !!(
    authMethods?.password?.enabled || authMethods?.oauth2?.enabled
)

const { tenantFilter } = useTenant()
let _settings = null
try {
    _settings = await pb.collection('settings').getFirstListItem(tenantFilter.value)
} catch {}
const orgName = _settings?.organization_name || ''
const orgUnitName = _settings?.organization_unit_name || ''

// ── State ──────────────────────────────────────────────────────────
const layout = useTemplateRef('layout')
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
        ({ login: 'WELCOME BACK', requestReset: 'ACCOUNT RECOVERY' })[
            view.value
        ] ?? '',
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
    oidc: 'mdi-lock',
    oidc2: 'mdi-lock',
    oidc3: 'mdi-lock',
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

// ── Tenant membership check ────────────────────────────────────────
async function checkTenantMembership() {
    if (pb.authStore.record?.is_super_admin) return true
    try {
        const tenant = await $fetch('/api/tenant').catch(() => null)
        if (!tenant?.id) return true
        await pb
            .collection('tenant_users')
            .getFirstListItem(
                `tenant_id = "${tenant.id}" && user_id = "${pb.authStore.record?.id}"`,
            )
        return true
    } catch {
        return false
    }
}

// ── Auth handlers ──────────────────────────────────────────────────
async function submitLogin() {
    if (!(await validate(loginForm))) return
    loading.value = true
    try {
        await pb
            .collection('users')
            .authWithPassword(identity.value, password.value, {
                autoRefreshThreshold: 0,
            })
        if (!(await checkTenantMembership())) {
            pb.authStore.clear()
            layout.value.notify(
                t('notifications.error.not_authorized_for_org', 'Not authorized for this organization.'),
                'error',
            )
            return
        }
        layout.value.notify(t('notifications.success.login'), 'success')
        await navigateTo('/admin/routes', { replace: true })
    } catch (err) {
        layout.value.notify(resolveAuthError(err), 'error')
    } finally {
        loading.value = false
    }
}

async function submitReset() {
    if (!(await validate(resetForm))) return
    loading.value = true
    try {
        await pb.collection('users').requestPasswordReset(resetEmail.value)
        layout.value.notify(t('notifications.success.resetPassword'), 'success')
        view.value = 'login'
        resetEmail.value = ''
    } catch (err) {
        layout.value.notify(resolveAuthError(err), 'error')
    } finally {
        loading.value = false
    }
}

async function loginWithOAuth(provider) {
    loading.value = true
    try {
        await pb.collection('users').authWithOAuth2({ provider })
        if (!(await checkTenantMembership())) {
            pb.authStore.clear()
            layout.value.notify(
                t('notifications.error.not_authorized_for_org', 'Not authorized for this organization.'),
                'error',
            )
            return
        }
        layout.value.notify(t('notifications.success.login'), 'success')
        await navigateTo('/admin/routes', { replace: true })
    } catch (err) {
        layout.value.notify(resolveAuthError(err), 'error')
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.form-swap-enter-active,
.form-swap-leave-active {
    transition:
        opacity 0.2s ease,
        transform 0.2s ease;
    position: absolute;
    width: 100%;
}
.form-swap-enter-from {
    opacity: 0;
    transform: translateX(16px);
}
.form-swap-leave-to {
    opacity: 0;
    transform: translateX(-16px);
}
</style>
