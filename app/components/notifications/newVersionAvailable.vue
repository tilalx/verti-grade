<template>
    <UAlert
        v-if="updateAvailable && !dismissed"
        color="info"
        variant="soft"
        icon="i-lucide-info"
        close
        class="rounded-none border-s-4 border-info"
        data-testid="update-banner"
        @update:open="(open: boolean) => !open && dismiss()"
    >
        <template #close="{ ui }">
            <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="link"
                :aria-label="$t('notifications.updateBanner.dismiss')"
                :class="ui.close()"
                @click="dismiss"
            />
        </template>
        <template #description>
            <div class="flex items-center flex-wrap gap-2">
                <strong>{{ $t('notifications.updateBanner.title') }}</strong>

                <template v-if="mode === 'release'">
                    <span>
                        {{
                            $t('notifications.updateBanner.message', [
                                latest?.tag,
                            ])
                        }}
                    </span>
                    <NotificationsReleaseNotesDialog
                        :tag="latest?.tag"
                        :notes="latest?.notes"
                        :published-at="latest?.publishedAt"
                        :repo-url="repoUrl"
                        :installed-version="appVersionLabel"
                        :error="error"
                        :loading="loading"
                    >
                        <template #activator="{ props: activatorProps }">
                            <UButton
                                v-bind="activatorProps"
                                color="neutral"
                                variant="ghost"
                                size="sm"
                                data-testid="update-banner-changelog"
                            >
                                {{
                                    $t(
                                        'notifications.updateBanner.viewChangelog',
                                    )
                                }}
                            </UButton>
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
                        :repo-url="repoUrl"
                        :installed-sha="appVersionLabel"
                    >
                        <template #activator="{ props: activatorProps }">
                            <UButton
                                v-bind="activatorProps"
                                color="neutral"
                                variant="ghost"
                                size="sm"
                                data-testid="update-banner-commits"
                            >
                                {{
                                    $t('notifications.updateBanner.viewCommits')
                                }}
                            </UButton>
                        </template>
                    </NotificationsCommitListDialog>
                </template>
            </div>
        </template>
    </UAlert>
</template>

<script setup lang="ts">
import { UPDATE_DISMISSED_KEY } from '~/utils/clientStorage'

const {
    appVersion,
    appVersionLabel,
    repoUrl,
    mode,
    updateAvailable,
    latest,
    commits,
    updateId,
    error,
    loading,
} = useVersionCheck()

const dismissedId = ref('')

onMounted(() => {
    try {
        dismissedId.value = localStorage.getItem(UPDATE_DISMISSED_KEY) ?? ''
    } catch {}
})

const dismissed = computed(
    () => !!updateId.value && dismissedId.value === updateId.value,
)

const dismiss = () => {
    dismissedId.value = updateId.value
    try {
        localStorage.setItem(UPDATE_DISMISSED_KEY, updateId.value)
    } catch {}
}
</script>
