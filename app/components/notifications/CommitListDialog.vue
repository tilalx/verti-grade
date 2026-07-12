<template>
    <v-dialog v-model="dialog" max-width="640" scrollable>
        <template #activator="{ props: activatorProps }">
            <slot name="activator" :props="activatorProps" />
        </template>

        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon start size="20">mdi-source-commit</v-icon>
                {{ $t('notifications.commitList.title') }}
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
                    $t('notifications.commitList.installedCommit', [
                        props.installedSha,
                    ])
                }}
            </v-card-subtitle>

            <v-card-text>
                <v-alert
                    v-if="!props.commits.length"
                    type="info"
                    variant="tonal"
                    dense
                >
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
                            {{ formatDate(commit.date) }}
                        </span>
                    </div>
                    <div class="commit-message">{{ commit.message }}</div>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup>
const props = defineProps({
    commits: {
        type: Array,
        default: () => [],
    },
    installedSha: {
        type: String,
        default: '',
    },
})

const dialog = ref(false)

const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString()
}
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
