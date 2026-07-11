<template>
    <v-container v-if="newVersionAvailable">
        <v-row justify="center">
            <v-col cols="auto">
                <NotificationsReleaseNotesDialog>
                    <template #activator="{ props: activatorProps }">
                        <v-alert
                            v-bind="activatorProps"
                            type="info"
                            dense
                            class="version-alert"
                        >
                            {{ $t('notifications.newVersionAvailable') }}
                        </v-alert>
                    </template>
                </NotificationsReleaseNotesDialog>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
const config = useRuntimeConfig()
const appVersion = config.public.appVersion

const repoOwner = 'tilalx'
const repoName = 'verti-grade'

const newVersionAvailable = ref(false)

const getGhVersion = async (currentVersion, repoOwner, repoName) => {
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`

    try {
        const response = await $fetch(apiUrl)
        const latestVersion = response.tag_name
        const draft = response.draft
        const prerelease = response.prerelease

        if (draft || prerelease || !latestVersion || !currentVersion) {
            return false
        }

        // Compare versions
        return compareVersions(latestVersion, currentVersion) > 0
    } catch (error) {
        console.error('Error fetching the latest release:', error)
        return false
    }
}

const checkForNewVersion = async () => {
    newVersionAvailable.value = await getGhVersion(
        appVersion,
        repoOwner,
        repoName,
    )
}

onMounted(checkForNewVersion)

function compareVersions(v1, v2) {
    // Rolling builds use git-describe versions ("1.9.0-5-gabc1234");
    // compare on the base semver and ignore the commit suffix.
    const parseVersion = (v) =>
        String(v).replace(/^v/, '').split('-')[0].split('.').map(Number)
    const v1Parts = parseVersion(v1)
    const v2Parts = parseVersion(v2)

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const v1Part = v1Parts[i] || 0
        const v2Part = v2Parts[i] || 0

        if (v1Part > v2Part) return 1
        if (v1Part < v2Part) return -1
    }

    return 0
}
</script>

<style scoped>
.version-alert {
    cursor: pointer;
}
</style>
