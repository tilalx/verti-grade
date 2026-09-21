<template>
    <v-card
        variant="tonal"
        class="list-card audit-card"
        :data-testid="`audit-card-${entry.id}`"
    >
        <div class="audit-card__body">
            <v-icon
                size="20"
                class="audit-card__icon"
                :color="actionColor(entry.action)"
                >{{ actionIcon(entry.action) }}</v-icon
            >

            <div class="audit-card__text">
                <!-- What happened, first and in the strongest type. The actor
                     and the address are context, not the headline. -->
                <div class="audit-card__summary">
                    <span
                        class="font-weight-medium"
                        :class="`text-${actionColor(entry.action)}`"
                        data-testid="audit-card-action"
                    >
                        {{ t(`audit.action.${entry.action}`) }}
                    </span>
                    <template v-if="targetLabel">
                        <span class="audit-card__dot">·</span>
                        <span
                            class="font-weight-medium"
                            data-testid="audit-card-target"
                            >{{ targetLabel }}</span
                        >
                    </template>
                </div>

                <div class="audit-card__meta text-body-small">
                    <span data-testid="audit-card-actor">{{ actorName }}</span>
                    <template v-if="entry.record_id">
                        <span class="audit-card__dot">·</span>
                        <NuxtLink
                            v-if="targetUrl"
                            :to="targetUrl"
                            class="audit-card__link"
                            data-testid="audit-card-record"
                            >{{ entry.record_id }}</NuxtLink
                        >
                        <span v-else>{{ entry.record_id }}</span>
                    </template>
                    <template v-if="ip">
                        <span class="audit-card__dot">·</span>
                        <span>{{ ip }}</span>
                    </template>
                </div>

                <!-- Field names only. The log never stores what a value
                     changed to, so there is nothing else to show here. -->
                <div
                    v-if="changedFields.length"
                    class="audit-card__meta text-body-small"
                >
                    <span>{{ t('audit.changedLabel') }}:</span>
                    <span data-testid="audit-card-fields">{{
                        changedFields.join(', ')
                    }}</span>
                </div>
            </div>

            <time
                class="audit-card__time text-body-small"
                :datetime="entry.created ?? undefined"
                :title="absoluteTime"
                data-testid="audit-card-time"
                >{{ relativeTime }}</time
            >
        </div>
    </v-card>
</template>

<script setup lang="ts">
import {
    actionColor,
    actionIcon,
    auditTargetUrl,
    compressIp,
    isRecordAction,
    isSuperuserEntry,
} from '~/utils/audit'
import { timeAgo } from '~/utils/formatting'
import type { AuditLogRecord } from '~/types/models'

const props = defineProps<{ entry: AuditLogRecord }>()

const { t, te, locale } = useI18n()

const actorName = computed(() => {
    if (isSuperuserEntry(props.entry)) return t('audit.superuser')
    return props.entry.actor_label || t('audit.anonymous')
})

// Only the record actions need naming what they acted on; "Signed in · User"
// reads worse than "Signed in".
const targetLabel = computed(() => {
    const name = props.entry.collection_name
    if (!name || !isRecordAction(props.entry.action)) return ''
    return te(`audit.target.${name}`) ? t(`audit.target.${name}`) : name
})

const targetUrl = computed(() =>
    auditTargetUrl(props.entry.collection_name, props.entry.record_id),
)

const changedFields = computed(() => props.entry.changed_fields ?? [])
const ip = computed(() => compressIp(props.entry.ip))

const relativeTime = computed(() =>
    timeAgo(props.entry.created, t, locale.value),
)

// PocketBase stores `2026-09-21 06:25:33.187Z`; the space has to become a T
// before Date will parse it the same way in every browser.
const absoluteTime = computed(() => {
    if (!props.entry.created) return ''
    return new Date(props.entry.created.replace(' ', 'T')).toLocaleString(
        locale.value,
    )
})
</script>

<style scoped>
.audit-card__body {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 14px;
}

.audit-card__icon {
    flex-shrink: 0;
    margin-top: 2px;
}

.audit-card__text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.audit-card__summary {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}

.audit-card__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    color: rgba(var(--v-theme-on-surface), 0.7);
}

.audit-card__dot {
    opacity: 0.45;
}

.audit-card__link {
    color: inherit;
}

.audit-card__time {
    flex-shrink: 0;
    white-space: nowrap;
    color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
