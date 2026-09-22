<template>
    <LayoutDialogShell
        v-model="localDialog"
        max-width="640"
        flush
        :persistent="hasChanges"
        class="profile-card"
        data-testid="profile-dialog"
    >
        <!-- ── Header ─────────────────────────────────────────── -->
        <div class="profile-header pa-6 pb-0">
            <div class="d-flex align-center ga-4">
                <!-- Avatar with upload overlay -->
                <div class="avatar-wrapper" @click="openAvatarPicker">
                    <v-avatar size="72" class="avatar-ring">
                        <v-img
                            v-if="avatarPreview"
                            :src="avatarPreview"
                            :alt="$t('account.changeAvatar')"
                            cover
                        />
                        <v-icon
                            v-else
                            icon="mdi-account-outline"
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
                    <div
                        class="text-title-large font-weight-bold text-truncate"
                    >
                        {{ fullName || $t('account.userProfile') }}
                    </div>
                    <div
                        class="text-body-medium text-medium-emphasis text-truncate"
                    >
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
                            <span class="locale-flag mr-1">{{
                                currentLocale.flag
                            }}</span>
                            {{ currentLocale.code.toUpperCase() }}
                            <v-icon end icon="mdi-chevron-down" size="16" />
                        </v-btn>
                    </template>
                    <v-list
                        density="compact"
                        rounded="lg"
                        min-width="170"
                        elevation="4"
                    >
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
                                <span class="locale-flag mr-3">{{
                                    loc.flag
                                }}</span>
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
                <v-tab value="profile" data-testid="profile-tab-profile">
                    <v-icon start icon="mdi-account-edit-outline" size="18" />
                    {{ $t('account.tabs.profile') }}
                </v-tab>
                <v-tab value="security" data-testid="profile-tab-security">
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
                                    :placeholder="
                                        $t('account.placeholders.firstname')
                                    "
                                    autocomplete="given-name"
                                    :rules="[rules.required]"
                                    counter="50"
                                    prepend-inner-icon="mdi-account-outline"
                                    data-testid="profile-firstname"
                                />
                            </v-col>

                            <v-col cols="12" sm="6">
                                <v-text-field
                                    v-model="user.name"
                                    :label="$t('account.lastname')"
                                    :placeholder="
                                        $t('account.placeholders.lastname')
                                    "
                                    autocomplete="family-name"
                                    :rules="[rules.required]"
                                    counter="50"
                                    prepend-inner-icon="mdi-account-outline"
                                    data-testid="profile-lastname"
                                />
                            </v-col>

                            <v-col cols="12">
                                <v-text-field
                                    v-model="user.email"
                                    :label="$t('account.email')"
                                    autocomplete="email"
                                    :rules="[rules.required, rules.email]"
                                    :hint="$t('account.emailChangeConfirmHint')"
                                    :persistent-hint="emailChangeRequested"
                                    prepend-inner-icon="mdi-email-outline"
                                    data-testid="profile-email"
                                />
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
                    <UserPasswordChangeFields
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
                        icon="mdi-information-outline"
                        class="mt-2"
                    >
                        {{ $t('account.passwordHint') }}
                    </v-alert>

                    <v-divider class="my-6" />

                    <div class="text-title-small font-weight-semibold mb-1">
                        {{ $t('account.deleteAccount') }}
                    </div>
                    <p class="text-body-small text-medium-emphasis mb-3">
                        {{ $t('account.deleteAccountHint') }}
                    </p>
                    <v-btn
                        color="error"
                        variant="tonal"
                        prepend-icon="mdi-delete-outline"
                        data-testid="profile-delete-open"
                        @click="deleteDialog = true"
                    >
                        {{ $t('account.deleteAccount') }}
                    </v-btn>
                </v-card-text>
            </v-window-item>
        </v-window>

        <ConfirmDialog
            v-model="deleteDialog"
            :title="$t('account.deleteAccount')"
            :message="$t('account.deleteAccountConfirm')"
            :confirm-text="$t('actions.delete')"
            :loading="deleting"
            @confirm="deleteAccount"
        />

        <template #actions>
            <v-btn
                variant="text"
                data-testid="profile-cancel"
                @click="cancelEdit"
            >
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
                :disabled="!canSave || saving"
                :loading="saving"
                prepend-icon="mdi-content-save-outline"
                data-testid="profile-save"
                @click="saveUser"
            >
                {{ $t('actions.save') }}
            </v-btn>
        </template>
    </LayoutDialogShell>
</template>

<script setup>
import { required, validEmail } from '~/utils/validation'

// ── i18n ──────────────────────────────────────────────────────────────────
const { t, locale, setLocale } = useI18n()

const locales = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'uk', label: 'Українська', flag: '🇺🇦' },
]
const currentLocale = computed(
    () => locales.find((l) => l.code === locale.value) ?? locales[0],
)

// ── PocketBase ────────────────────────────────────────────────────────────
const pb = usePocketbase()
const authRecord = pb.authStore.record

// ── User state ────────────────────────────────────────────────────────────
const user = reactive({
    ...(authRecord ?? {
        id: '',
        firstname: '',
        name: '',
        email: '',
        avatar: null,
    }),
    // Password fields — owned here, bound into PasswordChangeFields via v-model
    oldPassword: '',
    password: '',
    passwordConfirm: '',
})

const fullName = computed(() =>
    [user.firstname, user.name].filter(Boolean).join(' '),
)

// ── Avatar ────────────────────────────────────────────────────────────────
const avatarFile = ref(null)
const avatarPreview = ref(null)
const avatarInput = ref(null)

onMounted(() => {
    avatarPreview.value = user.avatar
        ? usePbFileUrl(user, user.avatar, { thumb: '100x100' })
        : null
})

function openAvatarPicker() {
    avatarInput.value?.click()
}

function onAvatarNative(e) {
    const file = e.target.files?.[0]
    if (file) {
        avatarFile.value = file
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
    () =>
        activeTab.value !== 'security' &&
        passwordChangeRequested.value &&
        !passwordFieldsValid.value,
)

// ── Profile-only validation rule (only "required" needed here) ────────────
const rules = {
    required: required(t),
    email: validEmail(t),
}

// ── Form ref (profile tab only) ───────────────────────────────────────────
const profileForm = ref(null)

// ── Change detection ──────────────────────────────────────────────────────
const original = {
    firstname: user.firstname,
    name: user.name,
    email: user.email,
}

const normalizedEmail = (value) =>
    String(value ?? '')
        .trim()
        .toLowerCase()

/**
 * The address is not written directly: PocketBase sends a confirmation link to
 * the NEW inbox and only swaps it once that link is opened, so the old address
 * stays live until then.
 */
const emailChangeRequested = computed(
    () =>
        !!normalizedEmail(user.email) &&
        normalizedEmail(user.email) !== normalizedEmail(original.email),
)

const hasChanges = computed(() => {
    if (avatarFile.value) return true
    if (passwordChangeRequested.value) return true
    if (emailChangeRequested.value) return true
    return user.firstname !== original.firstname || user.name !== original.name
})

function cancelEdit() {
    user.firstname = original.firstname
    user.name = original.name
    user.email = original.email
    user.oldPassword = ''
    user.password = ''
    user.passwordConfirm = ''
    avatarFile.value = null
    avatarPreview.value = user.avatar
        ? usePbFileUrl(user, user.avatar, { thumb: '100x100' })
        : null
    localDialog.value = false
}

/**
 * Save is only enabled when:
 *  - there are actual changes, AND
 *  - if the password section was touched, those fields are fully valid
 */
const canSave = computed(() => {
    if (!hasChanges.value) return false
    if (passwordChangeRequested.value && !passwordFieldsValid.value)
        return false
    return true
})

const { notify, error: notifyError } = useNotification()

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

    // Captured before the update: Object.assign() below resets user.email to
    // whatever PocketBase still has (the old address), which is correct --
    // the swap only happens once the new inbox confirms.
    const requestedEmail = user.email.trim()
    const wantsEmailChange = emailChangeRequested.value

    const formData = new FormData()
    formData.append('firstname', user.firstname)
    formData.append('name', user.name)

    if (passwordChangeRequested.value) {
        // oldPassword, password, passwordConfirm are owned by `user` reactive
        // and were kept in sync by PasswordChangeFields via v-model
        formData.append('oldPassword', user.oldPassword)
        formData.append('password', user.password)
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
            ? usePbFileUrl(updated, updated.avatar, { thumb: '100x100' })
            : null

        // Clear password fields
        user.oldPassword = ''
        user.password = ''
        user.passwordConfirm = ''
        avatarFile.value = null

        // Keep the session record fresh (re-writes the auth cookie)
        pb.authStore.save(pb.authStore.token, updated)

        // Update original snapshot so hasChanges resets to false
        original.firstname = updated.firstname
        original.name = updated.name
        original.email = updated.email ?? original.email

        if (wantsEmailChange) {
            try {
                await pb.collection('users').requestEmailChange(requestedEmail)
                notify(t('account.emailChangeSent'))
            } catch (mailError) {
                console.error('Error requesting email change:', mailError)
                notifyError(t('account.emailChangeFailed'))
            }
        } else {
            notify(t('notifications.success.edit'))
        }

        localDialog.value = false
    } catch (err) {
        const code = err?.response?.data?.oldPassword?.code
        if (code === 'validation_invalid_old_password') {
            notifyError(t('account.wrongOldPassword'))
            activeTab.value = 'security'
        } else {
            notifyError(t('notifications.error.edit'))
        }
    } finally {
        saving.value = false
    }
}

// ── Account deletion ──────────────────────────────────────────────────────
const deleteDialog = ref(false)
const deleting = ref(false)

async function deleteAccount() {
    deleting.value = true
    try {
        await pb.collection('users').delete(user.id)
        // Clear before navigating: the token still looks valid to the auth
        // middleware, which would bounce the user straight back in.
        pb.authStore.clear()
        deleteDialog.value = false
        localDialog.value = false
        await navigateTo('/auth/login')
    } catch (err) {
        console.error('Error deleting account:', err)
        notifyError(t('notifications.error.delete'))
    } finally {
        deleting.value = false
    }
}

// ── Dialog v-model ────────────────────────────────────────────────────────
const props = defineProps({
    dialogOpen: { type: Boolean, required: true },
})
const emit = defineEmits(['update:dialogOpen'])
const localDialog = ref(props.dialogOpen)

watch(localDialog, (val) => emit('update:dialogOpen', val))
watch(
    () => props.dialogOpen,
    (val) => (localDialog.value = val),
)
</script>

<style scoped>
/* ── Avatar ──────────────────────────────────────────── */
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
