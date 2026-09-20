<template>
    <LayoutDialogShell
        v-model="sheetOpen"
        max-width="600"
        closable
        sheet-on-mobile
        :title="$t('reports.dialogTitle')"
        data-testid="report-form-dialog"
    >
        <p class="text-body-medium text-medium-emphasis mb-4">
            {{ $t('reports.dialogIntro') }}
        </p>

        <v-form v-model="isFormValid">
            <v-select
                v-model="form.reason"
                :items="reasonItems"
                item-title="title"
                item-value="value"
                :label="$t('reports.reason')"
                :rules="[rules.required]"
                density="comfortable"
                hide-details="auto"
                class="mb-4"
                data-testid="report-form-reason"
            />

            <v-textarea
                v-model="form.explanation"
                :label="$t('reports.explanation')"
                :hint="$t('reports.explanationHint')"
                :rules="[rules.nonBlank, rules.explanationLength]"
                persistent-hint
                rows="3"
                auto-grow
                counter="2000"
                density="comfortable"
                class="mb-4"
                data-testid="report-form-explanation"
            />

            <v-row density="comfortable">
                <v-col cols="12" sm="6">
                    <v-text-field
                        v-model="form.notifierName"
                        :label="$t('reports.notifierName')"
                        :rules="[rules.nonBlank, rules.nameLength]"
                        density="comfortable"
                        hide-details="auto"
                        data-testid="report-form-name"
                    />
                </v-col>
                <v-col cols="12" sm="6">
                    <v-text-field
                        v-model="form.notifierEmail"
                        type="email"
                        :label="$t('reports.notifierEmail')"
                        :rules="[rules.required, rules.email]"
                        density="comfortable"
                        hide-details="auto"
                        data-testid="report-form-email"
                    />
                </v-col>
            </v-row>

            <p class="text-body-small text-medium-emphasis mt-2 mb-1">
                {{ $t('reports.contactNote') }}
                <a
                    v-if="privacyUrl"
                    :href="privacyUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    >{{ $t('legal.privacy') }}</a
                >
            </p>

            <!-- Art. 16(2)(d): the notice is only valid with this declaration,
                 so it is a validated field, not a courtesy checkbox. -->
            <v-checkbox
                v-model="form.goodFaith"
                :label="$t('reports.goodFaith')"
                :rules="[rules.mustAccept]"
                density="comfortable"
                data-testid="report-form-goodfaith"
            />
        </v-form>

        <template #actions>
            <v-btn
                variant="text"
                data-testid="report-form-cancel"
                @click="close"
                >{{ $t('actions.cancel') }}</v-btn
            >
            <v-spacer />
            <v-btn
                :disabled="!isFormValid"
                :loading="saving"
                color="primary"
                data-testid="report-form-submit"
                @click="submit"
            >
                {{ $t('reports.submit') }}
            </v-btn>
        </template>
    </LayoutDialogShell>
</template>

<script setup lang="ts">
import { required, nonBlank, maxLength, validEmail } from '~/utils/validation'
import { REPORT_REASONS } from '~/utils/reports'
import type { ReportContentType, SettingsRecord } from '~/types/models'

const props = defineProps<{
    contentType: ReportContentType
    contentId: string
    contentUrl: string
    modelValue?: boolean
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    submitted: []
}>()

const pb = usePocketbase()
const { t } = useI18n()
const { notify, error: notifyError } = useNotification()

const internalOpen = ref(false)

const sheetOpen = computed({
    get() {
        return props.modelValue !== undefined
            ? props.modelValue
            : internalOpen.value
    },
    set(val: boolean) {
        if (props.modelValue !== undefined) emit('update:modelValue', val)
        else internalOpen.value = val
    },
})

const isFormValid = ref(false)
const saving = ref(false)

const form = reactive({
    reason: null as string | null,
    explanation: '',
    notifierName: '',
    notifierEmail: '',
    goodFaith: false,
})

const reasonItems = computed(() =>
    REPORT_REASONS.map((value) => ({
        value,
        title: t(`reports.reasons.${value}`),
    })),
)

const { data: settings } = useNuxtData<SettingsRecord>('settings')
const privacyUrl = computed(() => settings.value?.privacy_url || '')

const rules = {
    required: required(t),
    nonBlank: nonBlank(t),
    email: validEmail(t),
    explanationLength: maxLength(t, 2000),
    nameLength: maxLength(t, 100),
    mustAccept: (v: unknown) => v === true || t('validation.required'),
}

function resetForm() {
    form.reason = null
    form.explanation = ''
    form.goodFaith = false
    // Prefill identity for signed-in reporters; Art. 16(2) needs it either way.
    const account = pb.authStore.record
    form.notifierName = (account?.name as string) || ''
    form.notifierEmail = (account?.email as string) || ''
}

// props.contentId doesn't change identity when the same card is reopened, so
// the reset hangs off the open state rather than the props.
watch(sheetOpen, (open) => {
    if (open) resetForm()
})

function close() {
    sheetOpen.value = false
}

async function submit() {
    saving.value = true
    try {
        // status/decision/receipt fields are stamped by the PocketBase create
        // hook and deliberately not sent from here.
        await pb.collection('reports').create({
            content_type: props.contentType,
            content_id: props.contentId,
            content_url: props.contentUrl,
            reason: form.reason,
            explanation: form.explanation.trim(),
            notifier_name: form.notifierName.trim(),
            notifier_email: form.notifierEmail.trim(),
            good_faith: form.goodFaith,
        })

        notify(t('reports.submitted'))
        emit('submitted')
        close()
    } catch (err) {
        console.error('Failed to submit report:', err)
        notifyError(t('notifications.error.generic'))
    } finally {
        saving.value = false
    }
}
</script>
