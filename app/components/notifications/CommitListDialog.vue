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
            v-for="commit in parsedCommits"
            v-else
            :key="commit.sha"
            class="commit-entry"
        >
            <div class="d-flex align-center flex-wrap ga-2 mb-1">
                <a
                    v-if="repoUrl"
                    :href="`${repoUrl}/commit/${commit.sha}`"
                    target="_blank"
                    rel="noopener"
                    class="commit-sha commit-link"
                    >{{ commit.sha }}</a
                >
                <span v-else class="commit-sha">{{ commit.sha }}</span>
                <span class="commit-date">
                    {{ formatDate(commit.date, { locale }) }}
                </span>
            </div>
            <div class="commit-message">
                {{ commit.text }}
                <template v-if="commit.pr">
                    <a
                        v-if="repoUrl"
                        :href="`${repoUrl}/pull/${commit.pr}`"
                        target="_blank"
                        rel="noopener"
                        class="commit-link"
                        data-testid="commit-pr-link"
                        >#{{ commit.pr }}</a
                    >
                    <span v-else>#{{ commit.pr }}</span>
                </template>
            </div>
        </div>
    </LayoutDialogShell>
</template>

<script setup lang="ts">
import { formatDate } from '#shared/utils/formatting'
import { parseChange } from '#shared/utils/releaseNotes'
import type { VersionCommit } from '~/composables/useVersionCheck'

const props = withDefaults(
    defineProps<{
        commits?: VersionCommit[]
        installedSha?: string
        repoUrl?: string | null
    }>(),
    { commits: () => [], installedSha: '', repoUrl: null },
)

const { locale } = useI18n()
const dialog = ref(false)

const parsedCommits = computed(() =>
    props.commits.map((commit) => {
        const change = parseChange(commit.message)
        const prefix = change.type
            ? `${change.type}${change.scope ? `(${change.scope})` : ''}: `
            : ''
        return { ...commit, text: `${prefix}${change.subject}`, pr: change.pr }
    }),
)
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

.commit-link {
    color: rgb(var(--v-theme-primary));
    text-decoration: none;
}

.commit-link:hover {
    text-decoration: underline;
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
