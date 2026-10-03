<template>
    <template v-if="visible">
        <NotificationsReleaseNotesDialog
            v-if="mode === 'release'"
            :tag="latest?.tag"
            :notes="latest?.notes"
            :published-at="latest?.publishedAt"
            :repo-url="repoUrl"
            :installed-version="appVersionLabel"
            :error="error"
            :loading="loading"
        >
            <template #activator="scope">
                <slot v-bind="scope" />
            </template>
        </NotificationsReleaseNotesDialog>

        <NotificationsCommitListDialog
            v-else
            :commits="commits"
            :repo-url="repoUrl"
            :installed-sha="appVersionLabel"
        >
            <template #activator="scope">
                <slot v-bind="scope" />
            </template>
        </NotificationsCommitListDialog>
    </template>
</template>

<script setup lang="ts">
const {
    appVersionLabel,
    repoUrl,
    mode,
    updateAvailable,
    latest,
    commits,
    error,
    loading,
} = useVersionCheck()
const { can } = usePermissions()

const visible = computed(
    () =>
        updateAvailable.value &&
        mode.value !== 'none' &&
        can('manage_settings'),
)
</script>
