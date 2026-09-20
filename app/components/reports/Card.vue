<template>
    <v-card
        variant="tonal"
        class="list-card"
        :data-testid="`report-card-${report.id}`"
    >
        <div class="list-card__header">
            <v-icon
                size="20"
                class="flex-shrink-0"
                :color="statusColor(report.status)"
                >mdi-flag-outline</v-icon
            >

            <div class="flex-grow-1 min-width-0">
                <div class="d-flex align-center ga-2 flex-wrap">
                    <span class="text-body-medium font-weight-medium">
                        {{ t(`reports.reasons.${report.reason}`) }}
                    </span>
                    <v-chip
                        size="x-small"
                        :color="statusColor(report.status)"
                        variant="tonal"
                        data-testid="report-card-status"
                    >
                        {{ t(`reports.status.${report.status}`) }}
                    </v-chip>
                    <v-chip
                        v-if="report.status !== 'open' && report.decision"
                        size="x-small"
                        variant="outlined"
                    >
                        {{ t(`reports.decision.${report.decision}`) }}
                    </v-chip>
                    <!-- Proof the Art. 16(4) receipt actually went out. -->
                    <v-chip
                        v-if="!report.receipt_sent"
                        size="x-small"
                        color="warning"
                        variant="outlined"
                        data-testid="report-card-receipt-pending"
                    >
                        {{ t('reports.receiptPending') }}
                    </v-chip>
                </div>
                <div class="text-body-small text-medium-emphasis">
                    {{ formatDate(report.created) }}
                </div>
            </div>
        </div>

        <div class="list-card__meta">
            <div class="list-card__meta-row list-card__meta-row--full">
                <span class="text-body-medium">{{ report.explanation }}</span>
            </div>

            <div class="list-card__meta-row list-card__meta-row--full mt-2">
                <span class="text-body-small text-medium-emphasis">
                    {{ t('reports.snapshot') }}:
                </span>
                <span class="text-body-small font-italic">
                    {{
                        report.content_snapshot ||
                        t('reports.contentUnavailable')
                    }}
                </span>
            </div>

            <div class="list-card__meta-row list-card__meta-row--full mt-2">
                <span class="text-body-small text-medium-emphasis">
                    {{ t('reports.notifier') }}:
                </span>
                <span class="text-body-small">
                    {{ report.notifier_name }} ({{ report.notifier_email }})
                </span>
            </div>

            <div
                v-if="report.decision_reason"
                class="list-card__meta-row list-card__meta-row--full mt-2"
            >
                <span class="text-body-small text-medium-emphasis">
                    {{ t('reports.decisionReason') }}:
                </span>
                <span class="text-body-small">{{
                    report.decision_reason
                }}</span>
            </div>
        </div>

        <v-card-actions class="list-card__actions">
            <v-btn
                variant="text"
                size="small"
                :href="report.content_url"
                target="_blank"
                rel="noopener noreferrer"
                prepend-icon="mdi-open-in-new"
                data-testid="report-card-view"
            >
                {{ t('reports.viewContent') }}
            </v-btn>
            <v-spacer />
            <template v-if="report.status === 'open'">
                <v-btn
                    variant="text"
                    size="small"
                    data-testid="report-card-keep"
                    @click="$emit('decide', report, 'content_kept')"
                >
                    {{ t('reports.keepContent') }}
                </v-btn>
                <v-btn
                    variant="flat"
                    size="small"
                    color="error"
                    data-testid="report-card-remove"
                    @click="$emit('decide', report, 'content_removed')"
                >
                    {{ t('reports.removeContent') }}
                </v-btn>
            </template>
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
import { statusColor } from '~/utils/reports'
import type { ReportDecision, ReportRecord } from '~/types/models'

defineProps<{ report: ReportRecord }>()

defineEmits<{ decide: [report: ReportRecord, decision: ReportDecision] }>()

const { t, locale } = useI18n()

function formatDate(value?: string | null) {
    if (!value) return ''
    return new Date(value.replace(' ', 'T')).toLocaleString(locale.value)
}
</script>
