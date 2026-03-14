<template>
    <v-dialog v-model="localDialog" max-width="640" :persistent="hasChanges">
        <v-card class="profile-card" rounded="xl" elevation="8">

            <!-- ── Header ─────────────────────────────────────────── -->
            <div class="profile-header pa-6 pb-0">
                <div class="d-flex align-center gap-4">

                    <!-- Avatar with upload overlay -->
                    <div class="avatar-wrapper" @click="openAvatarPicker">
                        <v-avatar size="72" class="avatar-ring">
                            <v-img v-if="avatarPreview" :src="avatarPreview" cover />
                            <v-icon
                                v-else
                                icon="mdi-account"
                                size="36"
                                color="grey-lighten-1"
                            />
                        </v-avatar>
                        <div class="avatar-overlay">
                            <v-icon icon="mdi-camera" size="18" color="white" />
                        </div>
                        <v-tooltip activator="parent" location="bottom">
                            {{ $t('account.changeAvatar') }}
                        </v-tooltip>
                    </div>

                    <div class="flex-grow-1 overflow-hidden">
                        <div class="text-h6 font-weight-bold text-truncate">
                            {{ fullName || $t('account.userProfile') }}
                        </div>
                        <div class="text-body-2 text-medium-emphasis text-truncate">
                            {{ user.email }}
                        </div>
                    </div>

                    <!-- Language switcher -->
                    <v-menu>
                        <template #activator="{ props: menuProps }">
                            <v-btn
                                v-bind="menuProps"
                                variant="tonal"
                                size="small"
                                rounded="pill"
                                class="flex-shrink-0"
                            >
                                <span class="locale-flag mr-1">{{ currentLocale.flag }}</span>
                                {{ currentLocale.code.toUpperCase() }}
                                <v-icon end icon="mdi-chevron-down" size="16" />
                            </v-btn>
                        </template>
                        <v-list density="compact" rounded="lg" min-width="170" elevation="4">
                            <v-list-item
                                v-for="loc in locales"
                                :key="loc.code"
                                :active="locale === loc.code"
                                :value="loc.code"
                                :title="loc.label"
                                rounded="lg"
                                @click="setLocale(loc.code)"
                            >
                                <template #prepend>
                                    <span class="locale-flag mr-3">{{ loc.flag }}</span>
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </div>

                <!-- Tabs -->
                <v-tabs
                    v-model="activeTab"
                    class="mt-4"
                    color="primary"
                    density="compact"
                >
                    <v-tab value="profile">
                        <v-icon start icon="mdi-account-edit-outline" size="18" />
                        {{ $t('account.tabs.profile') }}
                    </v-tab>
                    <v-tab value="security">
                        <v-icon start icon="mdi-shield-lock-outline" size="18" />
                        {{ $t('account.tabs.security') }}
                        <v-badge
                            v-if="showSecurityWarning"
                            color="warning"
                            dot
                            floating
                            inline
                            class="ml-1"
                        />
                    </v-tab>
                </v-tabs>
            </div>

            <v-divider class="mt-0" />

            <!-- hidden file input -->
            <input
                type="file"
                ref="avatarInput"
                accept="image/jpeg,image/png,image/svg+xml,image/webp"
                style="display: none"
                @change="onAvatarNative"
            />

            <!-- ── Tab windows ────────────────────────────────────── -->
            <v-window v-model="activeTab">

                <!-- Profile tab -->
                <v-window-item value="profile">
                    <v-card-text class="pa-6">
                        <v-form ref="profileForm" @submit.prevent>
                            <v-row density="comfortable">
                                <v-col cols="12" sm="6">
                                    <v-text-field
                                        v-model="user.firstname"
                                        :label="$t('account.firstname')"
                                        :placeholder="$t('account.placeholders.firstname')"
                                        autocomplete="given-name"
                                        variant="outlined"
                                        density="comfortable"
                                        :rules="[rules.required]"
                                        counter="50"
                                        prepend-inner-icon="mdi-account-outline"
                                    />
                                </v-col>

                                <v-col cols="12" sm="6">
                                    <v-text-field
                                        v-model="user.name"
                                        :label="$t('account.lastname')"
                                        :placeholder="$t('account.placeholders.lastname')"
                                        autocomplete="family-name"
                                        variant="outlined"
                                        density="comfortable"
                                        :rules="[rules.required]"
                                        counter="50"
                                        prepend-inner-icon="mdi-account-outline"
                                    />
                                </v-col>

                                <v-col cols="12">
                                    <v-text-field
                                        v-model="user.email"
                                        :label="$t('account.email')"
                                        autocomplete="email"
                                        variant="outlined"
                                        density="comfortable"
                                        disabled
                                        prepend-inner-icon="mdi-email-outline"
                                    >
                                        <template #append-inner>
                                            <v-tooltip :text="$t('account.emailLocked')" location="top">
                                                <template #activator="{ props: tp }">
                                                    <v-icon v-bind="tp" icon="mdi-lock-outline" size="18" />
                                                </template>
                                            </v-tooltip>
                                        </template>
                                    </v-text-field>
                                </v-col>
                            </v-row>
                        </v-form>
                    </v-card-text>
                </v-window-item>

                <!-- Security tab -->
                <v-window-item value="security">
                    <v-card-text class="pa-6">
                        <v-form ref="securityForm" @submit.prevent>
                            <v-row density="comfortable">

                                <!-- Current password -->
                                <v-col cols="12">
                                    <v-text-field
                                        v-model="user.oldPassword"
                                        :label="$t('account.oldPassword')"
                                        :placeholder="$t('account.placeholders.oldPassword')"
                                        :type="showOld ? 'text' : 'password'"
                                        autocomplete="current-password"
                                        variant="outlined"
                                        density="comfortable"
                                        :rules="passwordChangeRequested ? [rules.required] : []"
                                        prepend-inner-icon="mdi-lock-check-outline"
                                        :append-inner-icon="showOld ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                                        @click:append-inner="showOld = !showOld"
                                    />
                                </v-col>

                                <!-- New password -->
                                <v-col cols="12">
                                    <v-text-field
                                        v-model="user.password"
                                        :label="$t('account.password')"
                                        :placeholder="$t('account.placeholders.newPassword')"
                                        :type="showNew ? 'text' : 'password'"
                                        autocomplete="new-password"
                                        variant="outlined"
                                        density="comfortable"
                                        validate-on="blur"
                                        :rules="passwordChangeRequested
                                            ? [rules.required, rules.minLength, rules.maxLength, rules.strength]
                                            : []"
                                        prepend-inner-icon="mdi-lock-plus-outline"
                                        :append-inner-icon="showNew ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                                        @click:append-inner="showNew = !showNew"
                                    />

                                    <!-- Strength bar + checklist (animated) -->
                                    <Transition name="slide-down">
                                        <div v-if="user.password" class="mt-n1 mb-3 px-1">
                                            <div class="d-flex align-center justify-space-between mb-1">
                                                <span class="text-caption text-medium-emphasis">
                                                    {{ $t('account.passwordStrength') }}
                                                </span>
                                                <span
                                                    class="text-caption font-weight-bold"
                                                    :class="`text-${strengthColor}`"
                                                >
                                                    {{ $t(`account.strength.${strengthLabel}`) }}
                                                </span>
                                            </div>
                                            <div class="strength-bar-track">
                                                <div
                                                    v-for="n in 4"
                                                    :key="n"
                                                    class="strength-bar-segment"
                                                    :class="n <= strengthScore
                                                        ? `bg-${strengthColor}`
                                                        : 'bg-grey-lighten-3'"
                                                />
                                            </div>
                                            <div class="mt-3 requirements-grid">
                                                <div
                                                    v-for="req in passwordRequirements"
                                                    :key="req.key"
                                                    class="requirement-item"
                                                    :class="req.met ? 'met' : 'unmet'"
                                                >
                                                    <v-icon
                                                        :icon="req.met
                                                            ? 'mdi-check-circle'
                                                            : 'mdi-circle-outline'"
                                                        size="14"
                                                        class="mr-1 flex-shrink-0"
                                                    />
                                                    <span class="text-caption">
                                                        {{ $t(`account.requirements.${req.key}`) }}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Transition>
                                </v-col>

                                <!-- Confirm password -->
                                <v-col cols="12">
                                    <v-text-field
                                        v-model="user.passwordConfirm"
                                        :label="$t('account.newPassword')"
                                        :placeholder="$t('account.placeholders.confirmPassword')"
                                        :type="showConfirm ? 'text' : 'password'"
                                        autocomplete="new-password"
                                        variant="outlined"
                                        density="comfortable"
                                        validate-on="blur"
                                        :rules="passwordChangeRequested
                                            ? [rules.required, rules.matchPassword]
                                            : []"
                                        prepend-inner-icon="mdi-lock-check-outline"
                                        @click:append-inner="showConfirm = !showConfirm"
                                    >
                                        <!-- Always-mounted slot: swaps eye↔checkmark in place, no remount -->
                                        <template #append-inner>
                                            <v-icon
                                                v-if="passwordsMatch"
                                                icon="mdi-check-circle"
                                                color="success"
                                                size="20"
                                            />
                                            <v-icon
                                                v-else
                                                :icon="showConfirm ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                                                size="20"
                                                @click="showConfirm = !showConfirm"
                                            />
                                        </template>
                                    </v-text-field>
                                </v-col>
                            </v-row>
                        </v-form>

                        <!-- Hint when password change not started -->
                        <v-alert
                            v-if="!passwordChangeRequested"
                            type="info"
                            variant="tonal"
                            density="compact"
                            rounded="lg"
                            icon="mdi-information-outline"
                        >
                            {{ $t('account.passwordHint') }}
                        </v-alert>
                    </v-card-text>
                </v-window-item>
            </v-window>

            <v-divider />

            <!-- ── Actions ─────────────────────────────────────────── -->
            <v-card-actions class="pa-4">
                <v-btn variant="text" @click="localDialog = false">
                    {{ $t('actions.cancel') }}
                </v-btn>

                <v-spacer />

                <v-chip
                    v-if="hasChanges"
                    size="small"
                    color="warning"
                    variant="tonal"
                    prepend-icon="mdi-pencil-outline"
                    class="mr-2"
                >
                    {{ $t('account.unsavedChanges') }}
                </v-chip>

                <v-btn
                    color="primary"
                    variant="flat"
                    rounded="lg"
                    :disabled="!hasChanges || saving"
                    :loading="saving"
                    prepend-icon="mdi-content-save-outline"
                    @click="saveUser"
                >
                    {{ $t('actions.save') }}
                </v-btn>
            </v-card-actions>
        </v-card>

        <!-- ── Snackbar ──────────────────────────────────────────── -->
        <v-snackbar
            v-model="snackbar"
            :color="snackbarColor"
            location="top"
            rounded="pill"
            timeout="5000"
        >
            <div class="d-flex align-center gap-2">
                <v-icon
                    :icon="snackbarColor === 'success'
                        ? 'mdi-check-circle-outline'
                        : 'mdi-alert-circle-outline'"
                />
                {{ snackbarMessage }}
            </div>
            <template #actions>
                <v-btn variant="text" icon="mdi-close" size="small" @click="snackbar = false" />
            </template>
        </v-snackbar>
    </v-dialog>
</template>

<script setup>
// ── i18n ──────────────────────────────────────────────────────────────────
const { t, locale, setLocale } = useI18n()

const locales = [
    { code: 'en', label: 'English',    flag: '🇬🇧' },
    { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
    { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
    { code: 'tr', label: 'Türkçe',     flag: '🇹🇷' },
    { code: 'uk', label: 'Українська', flag: '🇺🇦' },
]
const currentLocale = computed(
    () => locales.find(l => l.code === locale.value) ?? locales[0],
)

// ── PocketBase ────────────────────────────────────────────────────────────
const pb = usePocketbase()
const pocketbaseAuth = JSON.parse(localStorage.getItem('pocketbase_auth') ?? 'null')

// ── User state ────────────────────────────────────────────────────────────
const user = reactive({
    ...(pocketbaseAuth?.record ?? {
        id: '', firstname: '', name: '', email: '', avatar: null,
    }),
    oldPassword: '',
    password: '',
    passwordConfirm: '',
})

const fullName = computed(() =>
    [user.firstname, user.name].filter(Boolean).join(' '),
)

// ── Avatar ────────────────────────────────────────────────────────────────
const avatarFile    = ref(null)
const avatarPreview = ref(null)
const avatarInput   = ref(null)

onMounted(() => {
    avatarPreview.value = user.avatar
        ? pb.files.getURL(user, user.avatar, { thumb: '100x100' })
        : null
})

function openAvatarPicker() { avatarInput.value?.click() }

function onAvatarNative(e) {
    const file = e.target.files?.[0]
    if (file) {
        avatarFile.value    = file
        avatarPreview.value = URL.createObjectURL(file)
    }
    e.target.value = ''
}

// ── Tabs ──────────────────────────────────────────────────────────────────
const activeTab = ref('profile')

const showSecurityWarning = computed(() =>
    activeTab.value !== 'security' &&
    passwordChangeRequested.value &&
    strengthScore.value < 3,
)

// ── Password visibility ───────────────────────────────────────────────────
const showOld     = ref(false)
const showNew     = ref(false)
const showConfirm = ref(false)

// ── Password strength ─────────────────────────────────────────────────────
const passwordChangeRequested = computed(
    () => !!(user.oldPassword || user.password || user.passwordConfirm),
)

const passwordRequirements = computed(() => [
    { key: 'minLength', met: user.password.length >= 8 },
    { key: 'maxLength', met: user.password.length <= 72 },
    { key: 'uppercase', met: /[A-Z]/.test(user.password) },
    { key: 'lowercase', met: /[a-z]/.test(user.password) },
    { key: 'number',    met: /\d/.test(user.password) },
    { key: 'special',   met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(user.password) },
])

const strengthScore = computed(() => {
    if (!user.password) return 0
    const met = passwordRequirements.value.filter(r => r.met).length
    if (met <= 2) return 1
    if (met <= 3) return 2
    if (met <= 4) return 3
    return 4
})

const strengthLabel = computed(() =>
    (['', 'weak', 'fair', 'good', 'strong'])[strengthScore.value] ?? 'weak',
)

const strengthColor = computed(() =>
    (['', 'error', 'warning', 'info', 'success'])[strengthScore.value] ?? 'error',
)

const passwordsMatch = computed(() =>
    !!(user.passwordConfirm && user.password === user.passwordConfirm),
)

// ── Validation rules ──────────────────────────────────────────────────────
const rules = {
    required:      (v) => !!v || t('validation.required'),
    minLength:     (v) => v.length >= 8  || t('validation.minLength', { n: 8 }),
    maxLength:     (v) => v.length <= 72 || t('validation.maxLength', { n: 72 }),
    matchPassword: (v) => v === user.password || t('validation.passwordMismatch'),
    strength:      () => strengthScore.value >= 3 || t('validation.passwordTooWeak'),
}

// ── Change detection ──────────────────────────────────────────────────────
const original = { firstname: user.firstname, name: user.name }

const hasChanges = computed(() => {
    if (avatarFile.value) return true
    if (passwordChangeRequested.value) return true
    return user.firstname !== original.firstname || user.name !== original.name
})

// ── Snackbar ──────────────────────────────────────────────────────────────
const snackbar        = ref(false)
const snackbarMessage = ref('')
const snackbarColor   = ref('')

function showSnackbar(message, color) {
    snackbarMessage.value = message
    snackbarColor.value   = color
    snackbar.value        = true
}

// ── Form refs ─────────────────────────────────────────────────────────────
const profileForm  = ref(null)
const securityForm = ref(null)

// ── Save ──────────────────────────────────────────────────────────────────
const saving = ref(false)

async function saveUser() {
    const profileValid  = (await profileForm.value?.validate())?.valid  ?? true
    const securityValid = passwordChangeRequested.value
        ? (await securityForm.value?.validate())?.valid ?? true
        : true

    if (!profileValid)  { activeTab.value = 'profile';  return }
    if (!securityValid) { activeTab.value = 'security'; return }

    saving.value = true
    const formData = new FormData()
    formData.append('firstname', user.firstname)
    formData.append('name',      user.name)
    if (passwordChangeRequested.value) {
        formData.append('oldPassword',     user.oldPassword)
        formData.append('password',        user.password)
        formData.append('passwordConfirm', user.passwordConfirm)
    }
    if (avatarFile.value) {
        formData.append('avatar', avatarFile.value)
    }

    try {
        const updated = await pb.collection('users').update(user.id, formData)

        Object.assign(user, updated)
        avatarPreview.value = updated.avatar
            ? pb.files.getURL(updated, updated.avatar, { thumb: '100x100' })
            : null

        user.oldPassword     = ''
        user.password        = ''
        user.passwordConfirm = ''
        avatarFile.value     = null

        const auth = JSON.parse(localStorage.getItem('pocketbase_auth'))
        auth.record = updated
        localStorage.setItem('pocketbase_auth', JSON.stringify(auth))

        original.firstname = updated.firstname
        original.name      = updated.name

        showSnackbar(t('notifications.success.edit'), 'success')
        localDialog.value = false
    } catch (err) {
        const code = err?.response?.data?.oldPassword?.code
        if (code === 'validation_invalid_old_password') {
            showSnackbar(t('account.wrongOldPassword'), 'error')
            activeTab.value = 'security'
        } else {
            showSnackbar(t('notifications.error.edit'), 'error')
        }
    } finally {
        saving.value = false
    }
}

// ── Dialog v-model ────────────────────────────────────────────────────────
const props = defineProps({
    dialogOpen: { type: Boolean, required: true },
})
const emit = defineEmits(['update:dialogOpen'])
const localDialog = ref(props.dialogOpen)

watch(localDialog,            (val) => emit('update:dialogOpen', val))
watch(() => props.dialogOpen, (val) => (localDialog.value = val))
</script>

<style scoped>
/* ── Avatar ──────────────────────────────────────────── */
.avatar-wrapper {
    position: relative;
    cursor: pointer;
    border-radius: 50%;
    flex-shrink: 0;
}
.avatar-ring {
    border: 2.5px solid rgba(var(--v-theme-primary), 0.3);
    transition: border-color 0.2s;
}
.avatar-wrapper:hover .avatar-ring {
    border-color: rgba(var(--v-theme-primary), 0.8);
}
.avatar-overlay {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
}
.avatar-wrapper:hover .avatar-overlay {
    opacity: 1;
}

/* ── Card header ─────────────────────────────────────── */
.profile-header {
    background: linear-gradient(
        135deg,
        rgba(var(--v-theme-surface-variant), 0.5) 0%,
        rgba(var(--v-theme-surface), 1) 100%
    );
}

/* ── Locale flag ─────────────────────────────────────── */
.locale-flag {
    font-size: 1.1em;
    line-height: 1;
}

/* ── Strength bar ────────────────────────────────────── */
.strength-bar-track {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
}
.strength-bar-segment {
    height: 4px;
    border-radius: 2px;
    transition: background-color 0.35s ease;
}

/* ── Requirements checklist ──────────────────────────── */
.requirements-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 12px;
}
.requirement-item {
    display: flex;
    align-items: center;
    transition: color 0.2s;
}
.requirement-item.met   { color: rgb(var(--v-theme-success)); }
.requirement-item.unmet { color: rgb(var(--v-theme-on-surface-variant)); opacity: 0.55; }

/* ── Slide-down transition for strength block ────────── */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: opacity 0.25s ease, max-height 0.25s ease;
    overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    max-height: 0;
}
.slide-down-enter-to,
.slide-down-leave-from {
    opacity: 1;
    max-height: 220px;
}
</style>