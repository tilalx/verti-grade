<template>
    <AuthTokenAction
        testid-prefix="email-change"
        brand-headline="login"
        :form-heading="{
            eyebrow: $t('account.eyebrowEmailChange'),
            title: $t('account.emailChange'),
            subtitle: $t('account.emailChangeHint'),
        }"
        :done-title="$t('account.emailChanged')"
        :done-subtitle="$t('notifications.success.emailChange')"
        :invalid-subtitle="$t('notifications.error.emailChange')"
        :action="confirmEmailChange"
        :is-token-error="isInvalidToken"
        :error-message="$t('account.wrongOldPassword')"
    >
        <template #default="{ submit, loading }">
            <v-form
                ref="form"
                v-model="valid"
                data-testid="email-change-form"
                @submit.prevent="validateAndSubmit(submit)"
            >
                <v-text-field
                    v-model="password"
                    :rules="passwordRules"
                    :label="$t('account.password')"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    prepend-inner-icon="mdi-lock-outline"
                    :append-inner-icon="
                        showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
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
                @click="validateAndSubmit(submit)"
            >
                {{ $t('actions.save') }}
            </v-btn>
        </template>
    </AuthTokenAction>
</template>

<script setup lang="ts">
import { required } from '~/utils/validation'

defineOptions({ name: 'ConfirmEmailChangePage' })
definePageMeta({ layout: 'blank', auth: false })

const { t } = useI18n()
const pb = usePocketbase()

useHead({ title: t('page.title.emailChange') })

const form = useTemplateRef<{ validate: () => Promise<{ valid: boolean }> }>(
    'form',
)
const valid = ref(false)
const password = ref('')
const showPassword = ref(false)
const passwordRules = [required(t)]

async function validateAndSubmit(submit: () => Promise<void>) {
    const result = await form.value?.validate()
    if (result?.valid) await submit()
}

async function confirmEmailChange(token: string) {
    await pb.collection('users').confirmEmailChange(token, password.value)
    pb.authStore.clear()
}

const isInvalidToken = (error: unknown) =>
    !!(error as { data?: { data?: { token?: unknown } } })?.data?.data?.token
</script>
