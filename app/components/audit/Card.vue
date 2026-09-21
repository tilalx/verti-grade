<template>
    <v-card
        variant="tonal"
        class="list-card"
        :data-testid="`audit-card-${entry.id}`"
    >
        <div class="list-card__header">
            <v-icon
                size="20"
                class="flex-shrink-0"
                :color="actionColor(entry.action)"
                >{{ actionIcon(entry.action) }}</v-icon
            >

            <div class="list-card__title">
                <div class="d-flex align-center ga-2 flex-wrap">
                    <span
                        class="text-body-medium font-weight-medium"
                        data-testid="audit-card-actor"
                    >
                        {{ actorName }}
                    </span>
                    <v-chip
                        size="x-small"
                        :color="actionColor(entry.action)"
                        variant="tonal"
                        data-testid="audit-card-action"
                    >
                        {{ t(`audit.action.${entry.action}`) }}
                    </v-chip>
                </div>
                <div class="text-body-small text-medium-emphasis">
                    {{ formatDate(entry.created) }}
                </div>
            </div>
        </div>

        <div class="list-card__meta">
            <div
                v-if="entry.collection_name"
                class="list-card__meta-row list-card__meta-row--full"
            >
                <v-icon size="16" class="list-card__meta-icon"
                    >mdi-database-outline</v-icon
                >
                <span class="text-body-small">
                    {{ collectionLabel }}
                    <NuxtLink
                        v-if="targetUrl"
                        :to="targetUrl"
                        class="audit-card__target"
                        data-testid="audit-card-target"
                        >{{ entry.record_id }}</NuxtLink
                    >
                    <span
                        v-else-if="entry.record_id"
                        class="text-medium-emphasis"
                    >
                        {{ entry.record_id }}
                    </span>
                </span>
            </div>

            <div
                v-if="entry.ip"
                class="list-card__meta-row list-card__meta-row--full"
            >
                <v-icon size="16" class="list-card__meta-icon"
                    >mdi-ip-network-outline</v-icon
                >
                <span class="text-body-small text-medium-emphasis">{{
                    entry.ip
                }}</span>
            </div>

            <!-- Field names only. The log never stores what a value changed to. -->
            <div v-if="changedFields.length" class="list-card__pills">
                <span
                    v-for="field in changedFields"
                    :key="field"
                    class="list-card__pill"
                    data-testid="audit-card-field"
                >
                    {{ field }}
                </span>
            </div>
        </div>
    </v-card>
</template>

<script setup lang="ts">
import {
    actionColor,
    actionIcon,
    auditTargetUrl,
    isSuperuserEntry,
} from '~/utils/audit'
import type { AuditLogRecord } from '~/types/models'

const props = defineProps<{ entry: AuditLogRecord }>()

const { t, te, locale } = useI18n()

const actorName = computed(() => {
    if (isSuperuserEntry(props.entry)) return t('audit.superuser')
    return props.entry.actor_label || t('audit.anonymous')
})

const collectionLabel = computed(() => {
    const name = props.entry.collection_name
    if (!name) return ''
    return te(`audit.collection.${name}`) ? t(`audit.collection.${name}`) : name
})

const targetUrl = computed(() =>
    auditTargetUrl(props.entry.collection_name, props.entry.record_id),
)

const changedFields = computed(() => props.entry.changed_fields ?? [])

// PocketBase stores `2026-09-21 06:25:33.187Z`; the space needs to become a T
// before Date will parse it the same way in every browser.
function formatDate(value?: string | null) {
    if (!value) return ''
    return new Date(value.replace(' ', 'T')).toLocaleString(locale.value)
}
</script>

<style scoped>
.audit-card__target {
    color: inherit;
}
</style>
