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

                    <div class="flex-grow-1 overflow-hidden ml-3">
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
                        <!--
                            Dot badge: user started typing a password on the security tab
                            but navigated away and the fields are not yet valid.
                        -->
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

            <!-- Hidden native file input for avatar -->
            <input
                type="file"
                ref="avatarInput"
                accept="image/jpeg,image/png,image/svg+xml,image/webp"
                style="display: none"
                @change="onAvatarNative"
            />

            <!-- ── Tab windows ────────────────────────────────────── -->
            <v-window v-model="activeTab">

                <!-- ── Profile tab ────────────────────────────────── -->
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

                <!-- ── Security tab ───────────────────────────────── -->
                <v-window-item value="security">
                    <v-card-text class="pa-6">
                        <!--
                            PasswordChangeFields owns all password state and
                            validation. We just bind the three string refs and
                            listen to @validity to know whether the block is
                            complete and valid before attempting to save.

                            :require-old-password="true" → current-password
                            field is shown and required (change flow).
                        -->
                        <PasswordChangeFields
                            v-model:old-password="user.oldPassword"
                            v-model:password="user.password"
                            v-model:password-confirm="user.passwordConfirm"
                            :require-old-password="true"
                            @validity="passwordFieldsValid = $event"
                        />

                        <!-- Hint shown when the user hasn't started yet -->
                        <v-alert
                            v-if="!passwordChangeRequested"
                            type="info"
                            variant="tonal"
                            density="compact"
                            rounded="lg"
                            icon="mdi-information-outline"
                            class="mt-2"
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
                    :disabled="!canSave || saving"
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
import PasswordChangeFields from '@/components/user/PasswordChangeFields.vue'

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
    // Password fields — owned here, bound into PasswordChangeFields via v-model
    oldPassword:     '',
    password:        '',
    passwordConfirm: '',
})

const fullName = computed(
    () => [user.firstname, user.name].filter(Boolean).join(' '),
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

// ── Password section state ────────────────────────────────────────────────
/**
 * True once the user has typed anything into any of the three password fields.
 * Used to show the "hint" alert and the security-tab warning badge.
 */
const passwordChangeRequested = computed(
    () => !!(user.oldPassword || user.password || user.passwordConfirm),
)

/**
 * Kept in sync by PasswordChangeFields via @validity.
 * True when all three fields satisfy their validation rules.
 */
const passwordFieldsValid = ref(false)

const showSecurityWarning = computed(
    () => activeTab.value !== 'security' &&
          passwordChangeRequested.value  &&
          !passwordFieldsValid.value,
)

// ── Profile-only validation rule (only "required" needed here) ────────────
const rules = {
    required: (v) => !!v || t('validation.required'),
}

// ── Form ref (profile tab only) ───────────────────────────────────────────
const profileForm = ref(null)

// ── Change detection ──────────────────────────────────────────────────────
const original = { firstname: user.firstname, name: user.name }

const hasChanges = computed(() => {
    if (avatarFile.value) return true
    if (passwordChangeRequested.value) return true
    return user.firstname !== original.firstname || user.name !== original.name
})

/**
 * Save is only enabled when:
 *  - there are actual changes, AND
 *  - if the password section was touched, those fields are fully valid
 */
const canSave = computed(() => {
    if (!hasChanges.value) return false
    if (passwordChangeRequested.value && !passwordFieldsValid.value) return false
    return true
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

// ── Save ──────────────────────────────────────────────────────────────────
const saving = ref(false)

async function saveUser() {
    // Validate profile fields (name, firstname)
    const profileResult = await profileForm.value?.validate()
    if (!profileResult?.valid) {
        activeTab.value = 'profile'
        return
    }

    // If password change was requested, guard against invalid state
    // (canSave already prevents the button being clickable, but this is
    // a safety net e.g. if called programmatically)
    if (passwordChangeRequested.value && !passwordFieldsValid.value) {
        activeTab.value = 'security'
        return
    }

    saving.value = true

    const formData = new FormData()
    formData.append('firstname', user.firstname)
    formData.append('name',      user.name)

    if (passwordChangeRequested.value) {
        // oldPassword, password, passwordConfirm are owned by `user` reactive
        // and were kept in sync by PasswordChangeFields via v-model
        formData.append('oldPassword',     user.oldPassword)
        formData.append('password',        user.password)
        formData.append('passwordConfirm', user.passwordConfirm)
    }

    if (avatarFile.value) {
        formData.append('avatar', avatarFile.value)
    }

    try {
        const updated = await pb.collection('users').update(user.id, formData)

        // Sync local reactive state with what PocketBase returned
        Object.assign(user, updated)
        avatarPreview.value = updated.avatar
            ? pb.files.getURL(updated, updated.avatar, { thumb: '100x100' })
            : null

        // Clear password fields
        user.oldPassword     = ''
        user.password        = ''
        user.passwordConfirm = ''
        avatarFile.value     = null

        // Persist updated record to localStorage (keeps app session fresh)
        const auth = JSON.parse(localStorage.getItem('pocketbase_auth'))
        auth.record = updated
        localStorage.setItem('pocketbase_auth', JSON.stringify(auth))

        // Update original snapshot so hasChanges resets to false
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
</style>