<template>
    <v-container>
        <v-row justify="center" v-if="newVersionAvailable">
            <v-col cols="auto">
                <v-alert type="info" dense>
                    {{ $t('notifications.newVersionAvailable') }}
                </v-alert>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import axios from 'axios'

const config = useRuntimeConfig()
const appVersion = config.public.appVersion

const repoOwner = 'tilalx'
const repoName = 'verti-grade'

const newVersionAvailable = ref(false)

async function checkNewVersion(currentVersion, repoOwner, repoName) {
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`

    try {
        const response = await axios.get(apiUrl)
        const latestVersion = response.data.name
        const draft = response.data.draft
        const prerelease = response.data.prerelease

        if (draft || prerelease) {
            return false
        }

        // Compare versions
        return compareVersions(latestVersion, currentVersion) > 0
    } catch (error) {
        console.error('Error fetching the latest release:', error)
        return false
    }
}

function compareVersions(v1, v2) {
    const v1Parts = v1.replace(/^v/, '').split('.').map(Number)
    const v2Parts = v2.replace(/^v/, '').split('.').map(Number)

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const v1Part = v1Parts[i] || 0
        const v2Part = v2Parts[i] || 0

        if (v1Part > v2Part) return 1
        if (v1Part < v2Part) return -1
    }

    return 0
}

onMounted(async () => {
    newVersionAvailable.value = await checkNewVersion(
        appVersion,
        repoOwner,
        repoName,
    )
})
</script>

<style scoped></style>
