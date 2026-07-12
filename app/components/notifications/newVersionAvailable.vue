<template>
    <div v-if="newVersionAvailable && !dismissed" class="update-banner">
        <div class="update-banner__text">
            <span class="update-banner__title">
                {{ $t('notifications.updateBanner.title') }}
            </span>

            <template v-if="mode === 'release'">
                <span class="update-banner__message">
                    {{
                        $t('notifications.updateBanner.message', [
                            latestVersion,
                        ])
                    }}
                </span>
                <NotificationsReleaseNotesDialog :version="latestVersion">
                    <template #activator="{ props: activatorProps }">
                        <a
                            href="#"
                            class="update-banner__link"
                            v-bind="activatorProps"
                            @click.prevent
                        >
                            {{ $t('notifications.updateBanner.viewChangelog') }}
                        </a>
                    </template>
                </NotificationsReleaseNotesDialog>
            </template>

            <template v-else>
                <span class="update-banner__message">
                    {{
                        $t('notifications.updateBanner.commitsMessage', [
                            commits.length,
                        ])
                    }}
                </span>
                <NotificationsCommitListDialog
                    :commits="commits"
                    :installed-sha="appVersion"
                >
                    <template #activator="{ props: activatorProps }">
                        <a
                            href="#"
                            class="update-banner__link"
                            v-bind="activatorProps"
                            @click.prevent
                        >
                            {{ $t('notifications.updateBanner.viewCommits') }}
                        </a>
                    </template>
                </NotificationsCommitListDialog>
            </template>
        </div>

        <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            density="comfortable"
            class="update-banner__close"
            :aria-label="$t('notifications.updateBanner.dismiss')"
            @click="dismissed = true"
        />
    </div>
</template>

<script setup>
const {
    appVersion,
    mode,
    newVersionAvailable,
    latestVersion,
    commits,
    checkForNewVersion,
} = useVersionCheck()

const dismissed = ref(false)

onMounted(() => {
    if (!newVersionAvailable.value) checkForNewVersion()
})
</script>

<style scoped>
.update-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    padding: 10px 24px;
    background-color: #0f2a1c;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.update-banner__text {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 0.875rem;
}

.update-banner__title {
    color: #fff;
    font-weight: 600;
}

.update-banner__message {
    color: rgba(255, 255, 255, 0.7);
}

.update-banner__link {
    color: #58a6ff;
    text-decoration: none;
    font-weight: 500;
}

.update-banner__link:hover {
    text-decoration: underline;
}

.update-banner__close {
    color: rgba(255, 255, 255, 0.7) !important;
}

.update-banner__close:hover {
    color: #fff !important;
}
</style>
