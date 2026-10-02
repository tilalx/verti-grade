<template>
    <div
        class="list-card rounded-lg bg-elevated"
        :data-testid="`report-card-${report.id}`"
    >
        <div class="list-card__header">
            <UIcon
                name="i-lucide-flag"
                class="shrink-0 size-[20px]"
                :class="statusTextClass[statusColor(report.status)]"
            />

            <div class="grow min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-medium">
                        {{ t(`reports.reasons.${report.reason}`) }}
                    </span>
                    <UBadge
                        size="sm"
                        :color="statusColor(report.status)"
                        variant="soft"
                        data-testid="report-card-status"
                    >
                        {{ t(`reports.status.${report.status}`) }}
                    </UBadge>
                    <UBadge
                        v-if="report.status !== 'open' && report.decision"
                        size="sm"
                        color="neutral"
                        variant="outline"
                    >
                        {{ t(`reports.decision.${report.decision}`) }}
                    </UBadge>
                    <UBadge
                        v-if="!report.receipt_sent"
                        size="sm"
                        color="warning"
                        variant="outline"
                        data-testid="report-card-receipt-pending"
                    >
                        {{ t('reports.receiptPending') }}
                    </UBadge>
                </div>
                <div class="text-xs text-muted">
                    {{ formatReportDate(report.created) }}
                </div>
            </div>
        </div>

        <div class="list-card__meta">
            <div class="list-card__meta-row list-card__meta-row--full">
                <span class="text-sm">{{ report.explanation }}</span>
            </div>

            <div class="list-card__meta-row list-card__meta-row--full mt-2">
                <span class="text-xs text-muted">
                    {{ t('reports.snapshot') }}:
                </span>
                <span class="text-xs italic">
                    {{
                        report.content_snapshot ||
                        t('reports.contentUnavailable')
                    }}
                </span>
            </div>

            <div class="list-card__meta-row list-card__meta-row--full mt-2">
                <span class="text-xs text-muted">
                    {{ t('reports.notifier') }}:
                </span>
                <span class="text-xs">
                    {{ report.notifier_name }} ({{ report.notifier_email }})
                </span>
            </div>

            <div
                v-if="report.decision_reason"
                class="list-card__meta-row list-card__meta-row--full mt-2"
            >
                <span class="text-xs text-muted">
                    {{ t('reports.decisionReason') }}:
                </span>
                <span class="text-xs">{{ report.decision_reason }}</span>
            </div>
        </div>

        <div class="list-card__actions flex items-center gap-1">
            <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                :href="appContentUrl(report.content_url)"
                target="_blank"
                rel="noopener noreferrer"
                icon="i-lucide-external-link"
                data-testid="report-card-view"
            >
                {{ t('reports.viewContent') }}
            </UButton>
            <div class="flex-1" />
            <template v-if="report.status === 'open'">
                <UButton
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    data-testid="report-card-keep"
                    @click="$emit('decide', report, 'content_kept')"
                >
                    {{ t('reports.keepContent') }}
                </UButton>
                <UButton
                    v-if="canRemove"
                    size="sm"
                    color="error"
                    data-testid="report-card-remove"
                    @click="$emit('decide', report, 'content_removed')"
                >
                    {{ t('reports.removeContent') }}
                </UButton>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { statusColor } from '~/utils/reports'
import { formatDate } from '#shared/utils/formatting'
import type { ReportDecision, ReportRecord } from '~/types/models'

defineProps<{ report: ReportRecord; canRemove: boolean }>()

defineEmits<{ decide: [report: ReportRecord, decision: ReportDecision] }>()

const { t, locale } = useI18n()

const statusTextClass = {
    warning: 'text-warning',
    success: 'text-success',
    neutral: 'text-muted',
}

const appContentUrl = (url: string) =>
    /^\/route\?id=\w+(#comment-\w+)?$/.test(url) ? url : undefined

function formatReportDate(value?: string | null) {
    return formatDate(value, { locale: locale.value, withTime: true })
}
</script>
