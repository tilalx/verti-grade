<template>
    <LayoutDialogShell
        v-model="open"
        :title="
            request
                ? `${$t(`competitions.export.kinds.${request.kind}`)} (${request.format.toUpperCase()})`
                : ''
        "
        data-testid="competition-export-dialog"
    >
        <UFormField :label="$t('export.language')">
            <USelect
                v-model="exportLocale"
                :items="localeItems"
                class="w-full"
                data-testid="export-locale"
            />
        </UFormField>
        <template #actions>
            <UButton color="neutral" variant="ghost" @click="open = false">
                {{ $t('actions.cancel') }}
            </UButton>
            <div class="flex-1" />
            <UButton
                color="primary"
                icon="i-lucide-download"
                :loading="loading"
                data-testid="export-confirm"
                @click="confirm"
            >
                {{ $t('actions.export') }}
            </UButton>
        </template>
    </LayoutDialogShell>
</template>

<script setup lang="ts">
import { SUPPORTED_LOCALES, type LocaleCode } from '~/utils/locales'
import type {
    CompetitionExportFormat,
    CompetitionExportKind,
} from '~/composables/useCompetitionExport'

const props = defineProps<{
    request: {
        kind: CompetitionExportKind
        format: CompetitionExportFormat
    } | null
    loading?: boolean
}>()

const emit = defineEmits<{ confirm: [locale: LocaleCode] }>()

const open = defineModel<boolean>({ default: false })

const { locale } = useI18n()

const exportLocale = ref(locale.value as LocaleCode)
watch(open, (isOpen) => {
    if (isOpen) exportLocale.value = locale.value as LocaleCode
})

const localeItems = SUPPORTED_LOCALES.map(({ code, name }) => ({
    label: name,
    value: code,
}))

function confirm() {
    if (props.request) emit('confirm', exportLocale.value)
}
</script>
