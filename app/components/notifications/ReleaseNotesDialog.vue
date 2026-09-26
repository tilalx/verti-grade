<template>
    <LayoutDialogShell
        v-model="dialog"
        max-width="680"
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
            v-else-if="!notes && !commits.length"
            type="info"
            data-testid="release-notes-empty"
        >
            {{ $t('notifications.releaseNotes.notFound') }}
        </v-alert>

        <template v-else>
            <section
                v-if="commits.length"
                class="mb-6"
                data-testid="release-notes-commits"
            >
                <div class="d-flex align-center ga-2 mb-2">
                    <span class="release-version">
                        {{
                            $t('notifications.releaseNotes.sinceRelease', [tag])
                        }}
                    </span>
                    <v-chip size="x-small" variant="tonal" color="primary">
                        {{ commits.length }}
                    </v-chip>
                </div>
                <div
                    v-for="commit in parsedCommits"
                    :key="commit.sha"
                    class="change-row"
                    data-testid="release-notes-commit"
                >
                    <span
                        :class="[
                            'change-type',
                            `change-type--${commit.category}`,
                        ]"
                    >
                        {{ commit.type ?? '•' }}
                    </span>
                    <div class="change-text">
                        <b v-if="commit.scope">{{ commit.scope }}:</b>
                        {{ commit.subject }}
                        <div class="change-meta">
                            <a
                                v-if="repoUrl"
                                :href="`${repoUrl}/commit/${commit.sha}`"
                                target="_blank"
                                rel="noopener"
                                class="change-link mono"
                                >{{ commit.sha }}</a
                            >
                            <span v-else class="mono">{{ commit.sha }}</span>
                            <span v-if="commit.date">
                                · {{ formatDate(commit.date, { locale }) }}
                            </span>
                            <template v-if="commit.pr">
                                ·
                                <a
                                    v-if="repoUrl"
                                    :href="`${repoUrl}/pull/${commit.pr}`"
                                    target="_blank"
                                    rel="noopener"
                                    class="change-link"
                                    >#{{ commit.pr }}</a
                                >
                                <span v-else>#{{ commit.pr }}</span>
                            </template>
                        </div>
                    </div>
                </div>
            </section>

            <section v-if="notes" data-testid="release-notes-release">
                <div class="d-flex align-center flex-wrap ga-2 mb-3">
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
                        {{ formatDate(publishedAt, { locale }) }}
                    </span>
                    <v-spacer />
                    <v-btn
                        v-if="repoUrl && tag"
                        :href="`${repoUrl}/releases/tag/${tag}`"
                        target="_blank"
                        rel="noopener"
                        size="small"
                        variant="text"
                        append-icon="mdi-open-in-new"
                    >
                        {{ $t('notifications.releaseNotes.viewOnGithub') }}
                    </v-btn>
                </div>

                <template v-if="release.changes.length">
                    <v-chip-group
                        v-model="category"
                        mandatory
                        selected-class="text-primary"
                        class="mb-2"
                    >
                        <v-chip
                            v-for="filter in filters"
                            :key="filter.value"
                            :value="filter.value"
                            size="small"
                            :variant="
                                category === filter.value ? 'tonal' : 'outlined'
                            "
                            :data-testid="`release-notes-filter-${filter.value}`"
                        >
                            {{
                                $t(
                                    `notifications.releaseNotes.filters.${filter.value}`,
                                )
                            }}
                            <span class="filter-count">{{ filter.count }}</span>
                        </v-chip>
                    </v-chip-group>

                    <div
                        v-for="(change, index) in visibleChanges"
                        :key="index"
                        class="change-row"
                        data-testid="release-notes-change"
                    >
                        <span
                            :class="[
                                'change-type',
                                `change-type--${change.category}`,
                            ]"
                        >
                            {{ change.type ?? '•' }}
                        </span>
                        <div class="change-text">
                            <v-chip
                                v-if="change.breaking"
                                size="x-small"
                                color="error"
                                variant="flat"
                                class="mr-1"
                            >
                                {{ $t('notifications.releaseNotes.breaking') }}
                            </v-chip>
                            <b v-if="change.scope">{{ change.scope }}:</b>
                            {{ change.subject }}
                            <div class="change-meta">
                                <span v-if="change.author"
                                    >@{{ change.author }}</span
                                >
                                <template v-if="change.pr">
                                    ·
                                    <a
                                        v-if="repoUrl"
                                        :href="`${repoUrl}/pull/${change.pr}`"
                                        target="_blank"
                                        rel="noopener"
                                        class="change-link"
                                        >#{{ change.pr }}</a
                                    >
                                    <span v-else>#{{ change.pr }}</span>
                                </template>
                            </div>
                        </div>
                    </div>

                    <div v-if="release.compare" class="release-footer">
                        {{ $t('notifications.releaseNotes.fullChangelog') }}
                        <a
                            v-if="repoUrl"
                            :href="`${repoUrl}/compare/${release.compare}`"
                            target="_blank"
                            rel="noopener"
                            class="change-link mono"
                            data-testid="release-notes-compare"
                            >{{ release.compare }}</a
                        >
                        <span v-else class="mono">{{ release.compare }}</span>
                    </div>
                </template>

                <div v-else class="release-body">{{ changelog }}</div>
            </section>
        </template>
    </LayoutDialogShell>
</template>

<script setup lang="ts">
import { formatDate } from '#shared/utils/formatting'
import {
    parseChange,
    parseReleaseNotes,
    type ChangeCategory,
} from '#shared/utils/releaseNotes'
import type { VersionCommit } from '~/composables/useVersionCheck'

const props = withDefaults(
    defineProps<{
        tag?: string | null
        notes?: string | null
        publishedAt?: string | null
        installedVersion?: string
        installed?: boolean
        error?: string | null
        loading?: boolean
        commits?: VersionCommit[]
        repoUrl?: string | null
    }>(),
    { commits: () => [], repoUrl: null },
)

const { locale } = useI18n()
const dialog = ref(false)
const category = ref<'all' | ChangeCategory>('all')

const release = computed(() => parseReleaseNotes(props.notes))

const parsedCommits = computed(() =>
    props.commits.map((commit) => ({
        ...commit,
        ...parseChange(commit.message),
    })),
)

const filters = computed(() => {
    const count = (value: ChangeCategory) =>
        release.value.changes.filter((change) => change.category === value)
            .length
    return [
        { value: 'all' as const, count: release.value.changes.length },
        ...(['feat', 'fix', 'deps', 'other'] as const).map((value) => ({
            value,
            count: count(value),
        })),
    ].filter((filter) => filter.count > 0)
})

const visibleChanges = computed(() =>
    category.value === 'all'
        ? release.value.changes
        : release.value.changes.filter(
              (change) => change.category === category.value,
          ),
)

const changelog = computed(() =>
    (props.notes ?? '')
        .replace(/\r\n/g, '\n')
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/^\s*[-*]\s+/gm, '• ')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
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

.filter-count {
    margin-left: 6px;
    opacity: 0.6;
    font-size: 0.75em;
}

.change-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 6px 0;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
    font-size: 13px;
}

.change-row:last-of-type {
    border-bottom: none;
}

.change-type {
    flex: 0 0 64px;
    padding: 1px 0;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    text-transform: lowercase;
    background: rgba(var(--v-theme-on-surface), 0.07);
    color: rgba(var(--v-theme-on-surface), 0.7);
}

.change-type--feat {
    background: rgba(var(--v-theme-primary), 0.14);
    color: rgb(var(--v-theme-primary));
}

.change-type--fix {
    background: rgba(var(--v-theme-error), 0.12);
    color: rgb(var(--v-theme-error));
}

.change-type--deps {
    background: rgba(var(--v-theme-on-surface), 0.05);
    color: rgba(var(--v-theme-on-surface), 0.5);
}

.change-text {
    flex: 1;
    min-width: 0;
    word-break: break-word;
    color: rgba(var(--v-theme-on-surface), 0.87);
}

.change-meta {
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.55);
}

.change-link {
    color: rgb(var(--v-theme-primary));
    text-decoration: none;
}

.change-link:hover {
    text-decoration: underline;
}

.release-footer {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.55);
}

.mono {
    font-family: monospace;
}
</style>
