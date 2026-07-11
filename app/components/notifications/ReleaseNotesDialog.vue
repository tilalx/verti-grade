<template>
    <v-dialog v-model="dialog" max-width="640" scrollable>
        <template #activator="{ props: activatorProps }">
            <slot name="activator" :props="activatorProps" />
        </template>

        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon start size="20">mdi-tag-outline</v-icon>
                {{ $t('notifications.releaseNotes.title') }}
                <v-spacer />
                <v-btn
                    icon="mdi-close"
                    variant="text"
                    density="comfortable"
                    @click="dialog = false"
                />
            </v-card-title>

            <v-card-subtitle>
                {{
                    $t('notifications.releaseNotes.installedVersion', [
                        appVersion,
                    ])
                }}
            </v-card-subtitle>

            <v-card-text>
                <div v-if="loading" class="d-flex justify-center py-8">
                    <v-progress-circular indeterminate />
                </div>

                <v-alert v-else-if="error" type="error" variant="tonal" dense>
                    {{ $t('notifications.releaseNotes.error') }}
                </v-alert>

                <div v-else-if="release" class="release-entry">
                    <div class="d-flex align-center flex-wrap ga-2 mb-1">
                        <span class="release-version">
                            {{ release.tag_name }}
                        </span>
                        <v-chip
                            v-if="isInstalledVersion(release.tag_name)"
                            size="x-small"
                            color="success"
                            variant="tonal"
                        >
                            {{ $t('notifications.releaseNotes.installed') }}
                        </v-chip>
                        <span class="release-date">
                            {{ formatDate(release.published_at) }}
                        </span>
                    </div>
                    <div class="release-body">
                        {{ formatChangelog(release.body) }}
                    </div>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup>
const props = defineProps({
    // Release tag to show (e.g. "1.9.0" or "1.9.0-5-gabc1234").
    // Omit to show the latest release instead.
    version: {
        type: String,
        default: '',
    },
})

const config = useRuntimeConfig()
const appVersion = config.public.appVersion

const repoOwner = 'tilalx'
const repoName = 'verti-grade'

const dialog = ref(false)
const release = ref(null)
const loading = ref(false)
const error = ref(false)
const loaded = ref(false)

// Rolling builds carry a git-describe suffix ("1.9.0-5-gabc1234");
// only the base semver maps to a release tag.
const baseSemver = (version) => {
    const match = String(version ?? '').match(/^v?(\d+\.\d+\.\d+)/)
    return match ? match[1] : null
}

const fetchRelease = async () => {
    loading.value = true
    error.value = false
    try {
        const base = baseSemver(props.version)
        const endpoint = base ? `releases/tags/v${base}` : 'releases/latest'
        release.value = await $fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/${endpoint}`,
        )
        loaded.value = true
    } catch (err) {
        console.error('Error fetching release:', err)
        error.value = true
    } finally {
        loading.value = false
    }
}

watch(dialog, (open) => {
    if (open && !loaded.value) {
        fetchRelease()
    }
})

const isInstalledVersion = (tagName) => {
    if (!appVersion || !tagName) return false
    const base = baseSemver(appVersion)
    return base ? tagName.replace(/^v/, '') === base : false
}

const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString()
}

// Release bodies are GitHub markdown; render as readable plain text
// instead of pulling in a markdown library (avoids v-html/XSS).
const formatChangelog = (body) => {
    if (!body) return ''
    return body
        .replace(/\r\n/g, '\n')
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/^\s*[-*]\s+/gm, '• ')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/https:\/\/github\.com\/\S+\/pull\/(\d+)/g, '#$1')
        .replace(/https:\/\/github\.com\/\S+\/compare\/(\S+)/g, '$1')
        .trim()
}
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
