<template>
    <LayoutDialogShell
        v-model="dialog"
        max-width="640"
        closable
        :subtitle="
            $t('notifications.releaseNotes.installedVersion', [
                installedVersion,
            ])
        "
        data-testid="release-notes-dialog"
    >
        <template #activator="activatorScope">
            <slot name="activator" v-bind="activatorScope" />
        </template>

        <template #title>
            <v-icon size="20">mdi-tag-outline</v-icon>
            {{ $t('notifications.releaseNotes.title') }}
        </template>

        <div
            v-if="loading"
            class="d-flex justify-center py-8"
            data-testid="release-notes-loading"
        >
            <v-progress-circular
                indeterminate
                size="24"
                width="2"
                color="primary"
            />
        </div>

        <v-alert
            v-else-if="error"
            type="error"
            data-testid="release-notes-error"
        >
            {{ $t('notifications.releaseNotes.error') }}
        </v-alert>

        <v-alert
            v-else-if="!notes"
            type="info"
            data-testid="release-notes-empty"
        >
            {{ $t('notifications.releaseNotes.notFound') }}
        </v-alert>

        <div v-else class="release-entry">
            <div class="d-flex align-center flex-wrap ga-2 mb-1">
                <span class="release-version">{{ tag }}</span>
                <v-chip
                    v-if="installed"
                    size="x-small"
                    color="success"
                    variant="tonal"
                >
                    {{ $t('notifications.releaseNotes.installed') }}
                </v-chip>
                <span class="release-date">
                    {{ formatDisplayDate(publishedAt, locale) }}
                </span>
            </div>
            <div class="release-body">{{ changelog }}</div>
        </div>
    </LayoutDialogShell>
</template>

<script setup lang="ts">
import { formatDisplayDate } from '~/utils/formatting'

const props = defineProps<{
    tag?: string | null
    notes?: string | null
    publishedAt?: string | null
    installedVersion?: string
    installed?: boolean
    error?: string | null
    loading?: boolean
}>()

const { locale } = useI18n()
const dialog = ref(false)

// Release bodies are GitHub markdown; render as readable plain text
// instead of pulling in a markdown library (avoids v-html/XSS).
const changelog = computed(() =>
    (props.notes ?? '')
        .replace(/\r\n/g, '\n')
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/^\s*[-*]\s+/gm, '• ')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/https:\/\/github\.com\/\S+\/pull\/(\d+)/g, '#$1')
        .replace(/https:\/\/github\.com\/\S+\/compare\/(\S+)/g, '$1')
        .trim(),
)
</script>

<style scoped>
.release-version {
    font-weight: 600;
    font-size: 15px;
}

.release-date {
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.55);
}

.release-body {
    white-space: pre-wrap;
    font-size: 13px;
    color: rgba(var(--v-theme-on-surface), 0.75);
    word-break: break-word;
}
</style>
