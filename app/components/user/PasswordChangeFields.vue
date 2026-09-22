<template>
    <div class="pcf-root">
        <v-text-field
            v-if="requireOldPassword"
            :model-value="oldPassword"
            :label="$t('account.oldPassword')"
            :placeholder="$t('account.placeholders.oldPassword')"
            :type="showOld ? 'text' : 'password'"
            autocomplete="current-password"
            :rules="[rules.required]"
            prepend-inner-icon="mdi-lock-check-outline"
            :append-inner-icon="
                showOld ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
            "
            data-testid="password-old"
            @update:model-value="emit('update:oldPassword', $event)"
            @click:append-inner="showOld = !showOld"
        />

        <v-text-field
            :model-value="password"
            :label="$t('account.password')"
            :placeholder="$t('account.placeholders.newPassword')"
            :type="showNew ? 'text' : 'password'"
            autocomplete="new-password"
            validate-on="blur"
            :rules="[
                rules.required,
                rules.minLength,
                rules.maxLength,
                rules.strength,
            ]"
            prepend-inner-icon="mdi-lock-plus-outline"
            :append-inner-icon="
                showNew ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
            "
            data-testid="password-new"
            @update:model-value="emit('update:password', $event)"
            @click:append-inner="showNew = !showNew"
        />

        <Transition name="pcf-slide-down">
            <div v-if="password" class="mt-n2 mb-3 px-1">
                <div class="d-flex align-center justify-space-between mb-1">
                    <span class="text-body-small text-medium-emphasis">
                        {{ $t('account.passwordStrength') }}
                    </span>
                    <span
                        class="text-body-small font-weight-bold"
                        :class="`text-${strengthColor}`"
                    >
                        {{ $t(`account.strength.${strengthLabel}`) }}
                    </span>
                </div>

                <div class="pcf-strength-track">
                    <div
                        v-for="n in 4"
                        :key="n"
                        class="pcf-strength-segment"
                        :class="
                            n <= strengthScore
                                ? `bg-${strengthColor}`
                                : 'pcf-segment-empty'
                        "
                    />
                </div>

                <div class="mt-3 pcf-requirements-grid">
                    <div
                        v-for="req in passwordRequirements"
                        :key="req.key"
                        class="pcf-requirement-item"
                        :class="req.met ? 'met' : 'unmet'"
                    >
                        <v-icon
                            :icon="
                                req.met
                                    ? 'mdi-check-circle-outline'
                                    : 'mdi-circle-outline'
                            "
                            size="14"
                            class="mr-1 flex-shrink-0"
                        />
                        <span class="text-body-small">
                            {{ $t(`account.requirements.${req.key}`) }}
                        </span>
                    </div>
                </div>
            </div>
        </Transition>

        <v-text-field
            :model-value="passwordConfirm"
            :label="$t('account.newPassword')"
            :placeholder="$t('account.placeholders.confirmPassword')"
            :type="showConfirm ? 'text' : 'password'"
            autocomplete="new-password"
            validate-on="blur"
            :rules="[rules.required, rules.matchPassword]"
            prepend-inner-icon="mdi-lock-check-outline"
            data-testid="password-confirm"
            @update:model-value="emit('update:passwordConfirm', $event)"
        >
            <template #append-inner>
                <v-icon
                    v-if="passwordsMatch"
                    icon="mdi-check-circle-outline"
                    color="success"
                    size="20"
                />
                <v-icon
                    v-else
                    :icon="
                        showConfirm ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
                    "
                    size="20"
                    @click="showConfirm = !showConfirm"
                />
            </template>
        </v-text-field>
    </div>
</template>

<script setup>
import {
    required,
    minLength,
    maxLength,
    passwordsMatch as makePasswordsMatchRule,
} from '~/utils/validation'
const props = defineProps({
    requireOldPassword: { type: Boolean, default: true },

    oldPassword: { type: String, default: '' },
    password: { type: String, default: '' },
    passwordConfirm: { type: String, default: '' },
})

const emit = defineEmits([
    'update:oldPassword',
    'update:password',
    'update:passwordConfirm',
    'validity',
])

// ── i18n ──────────────────────────────────────────────────────────────────
const { t } = useI18n()

// ── Visibility toggles ────────────────────────────────────────────────────
const showOld = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

// ── Strength logic ────────────────────────────────────────────────────────
const passwordRequirements = computed(() => [
    { key: 'minLength', met: props.password.length >= 8 },
    { key: 'maxLength', met: props.password.length <= 72 },
    { key: 'uppercase', met: /[A-Z]/.test(props.password) },
    { key: 'lowercase', met: /[a-z]/.test(props.password) },
    { key: 'number', met: /\d/.test(props.password) },
    {
        key: 'special',
        met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(props.password),
    },
])

const strengthScore = computed(() => {
    if (!props.password) return 0
    const met = passwordRequirements.value.filter((r) => r.met).length
    if (met <= 2) return 1
    if (met <= 3) return 2
    if (met <= 4) return 3
    return 4
})

const strengthLabel = computed(
    () => ['', 'weak', 'fair', 'good', 'strong'][strengthScore.value] ?? 'weak',
)

const strengthColor = computed(
    () =>
        ['', 'error', 'warning', 'info', 'success'][strengthScore.value] ??
        'error',
)

const passwordsMatch = computed(
    () => !!(props.passwordConfirm && props.password === props.passwordConfirm),
)

const rules = {
    required: required(t),
    minLength: minLength(t, 8),
    maxLength: maxLength(t, 72),
    matchPassword: makePasswordsMatchRule(t, () => props.password),
    strength: () => strengthScore.value >= 3 || t('validation.passwordTooWeak'),
}

const isValid = computed(() => {
    const baseOk =
        props.password.length >= 8 &&
        props.password.length <= 72 &&
        strengthScore.value >= 3 &&
        passwordsMatch.value

    return props.requireOldPassword ? baseOk && !!props.oldPassword : baseOk
})

watch(isValid, (val) => emit('validity', val), { immediate: true })
</script>

<style scoped>
.pcf-strength-track {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
}
.pcf-strength-segment {
    height: 4px;
    border-radius: 2px;
    transition: background-color 0.35s ease;
}
.pcf-segment-empty {
    background-color: rgba(var(--v-theme-on-surface), 0.12);
}

.pcf-requirements-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 12px;
}
.pcf-requirement-item {
    display: flex;
    align-items: center;
    transition: color 0.2s;
}
.pcf-requirement-item.met {
    color: rgb(var(--v-theme-success));
}
.pcf-requirement-item.unmet {
    color: rgba(var(--v-theme-on-surface), 0.45);
}

.pcf-slide-down-enter-active,
.pcf-slide-down-leave-active {
    transition:
        opacity 0.25s ease,
        max-height 0.25s ease;
    overflow: hidden;
}
.pcf-slide-down-enter-from,
.pcf-slide-down-leave-to {
    opacity: 0;
    max-height: 0;
}
.pcf-slide-down-enter-to,
.pcf-slide-down-leave-from {
    opacity: 1;
    max-height: 220px;
}
</style>
