<template>
    <v-alert
        v-if="updateAvailable && !dismissed"
        type="info"
        variant="tonal"
        density="compact"
        border="start"
        closable
        rounded="0"
        data-testid="update-banner"
        :close-label="$t('notifications.updateBanner.dismiss')"
        @click:close="dismiss"
    >
        <div class="d-flex align-center flex-wrap ga-2">
            <strong>{{ $t('notifications.updateBanner.title') }}</strong>

            <template v-if="mode === 'release'">
                <span>
                    {{
                        $t('notifications.updateBanner.message', [latest?.tag])
                    }}
                </span>
                <NotificationsReleaseNotesDialog
                    :tag="latest?.tag"
                    :notes="latest?.notes"
                    :published-at="latest?.publishedAt"
                    :installed-version="appVersion"
                    :error="error"
                    :loading="loading"
                >
                    <template #activator="{ props: activatorProps }">
                        <v-btn
                            v-bind="activatorProps"
                            variant="text"
                            size="small"
                            density="comfortable"
                            data-testid="update-banner-changelog"
                        >
                            {{ $t('notifications.updateBanner.viewChangelog') }}
                        </v-btn>
                    </template>
                </NotificationsReleaseNotesDialog>
            </template>

            <template v-else>
                <span>
                    {{
                        $t(
                            'notifications.updateBanner.commitsMessage',
                            commits.length,
                        )
                    }}
                </span>
                <NotificationsCommitListDialog
                    :commits="commits"
                    :installed-sha="appVersion"
                >
                    <template #activator="{ props: activatorProps }">
                        <v-btn
                            v-bind="activatorProps"
                            variant="text"
                            size="small"
                            density="comfortable"
                            data-testid="update-banner-commits"
                        >
                            {{ $t('notifications.updateBanner.viewCommits') }}
                        </v-btn>
                    </template>
                </NotificationsCommitListDialog>
            </template>
        </div>
    </v-alert>
</template>

<script setup lang="ts">
const {
    appVersion,
    mode,
    updateAvailable,
    latest,
    commits,
    updateId,
    error,
    loading,
} = useVersionCheck()

const DISMISS_KEY = 'verti-grade:update-dismissed'

const dismissedId = ref('')

onMounted(() => {
    try {
        dismissedId.value = localStorage.getItem(DISMISS_KEY) ?? ''
    } catch {
        // Private mode or blocked storage: the banner just stays dismissable
        // for this page view only.
    }
})

const dismissed = computed(
    () => !!updateId.value && dismissedId.value === updateId.value,
)

const dismiss = () => {
    dismissedId.value = updateId.value
    try {
        localStorage.setItem(DISMISS_KEY, updateId.value)
    } catch {
        // See above.
    }
}
</script>
