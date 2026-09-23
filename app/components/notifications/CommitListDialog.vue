<template>
    <LayoutDialogShell
        v-model="dialog"
        max-width="640"
        closable
        :subtitle="
            $t('notifications.commitList.installedCommit', [props.installedSha])
        "
        data-testid="commit-list-dialog"
    >
        <template #activator="activatorScope">
            <slot name="activator" v-bind="activatorScope" />
        </template>

        <template #title>
            <v-icon size="20">mdi-source-commit</v-icon>
            {{ $t('notifications.commitList.title') }}
        </template>

        <v-alert v-if="!props.commits.length" type="info">
            {{ $t('notifications.commitList.empty') }}
        </v-alert>

        <div
            v-for="commit in props.commits"
            v-else
            :key="commit.sha"
            class="commit-entry"
        >
            <div class="d-flex align-center flex-wrap ga-2 mb-1">
                <span class="commit-sha">{{ commit.sha }}</span>
                <span class="commit-date">
                    {{ formatDate(commit.date, { locale }) }}
                </span>
            </div>
            <div class="commit-message">{{ commit.message }}</div>
        </div>
    </LayoutDialogShell>
</template>

<script setup lang="ts">
import { formatDate } from '#shared/utils/formatting'
import type { VersionCommit } from '~/composables/useVersionCheck'

const props = withDefaults(
    defineProps<{
        commits?: VersionCommit[]
        installedSha?: string
    }>(),
    { commits: () => [], installedSha: '' },
)

const { locale } = useI18n()
const dialog = ref(false)
</script>

<style scoped>
.commit-entry {
    padding: 8px 0;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.commit-entry:last-child {
    border-bottom: none;
}

.commit-sha {
    font-family: monospace;
    font-weight: 600;
    font-size: 13px;
}

.commit-date {
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.55);
}

.commit-message {
    font-size: 13px;
    color: rgba(var(--v-theme-on-surface), 0.85);
    word-break: break-word;
}
</style>
