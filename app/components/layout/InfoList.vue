<template>
    <section class="info-list" data-testid="me-info">
        <p class="info-list__heading">{{ $t('me.info') }}</p>
        <v-list class="info-list__card" nav rounded="lg" bg-color="surface">
            <v-list-item
                v-bind="legalLinkProps(settings?.privacy_url, '/privacy')"
                prepend-icon="mdi-shield-lock-outline"
                :title="$t('legal.privacy')"
                append-icon="mdi-chevron-right"
                data-testid="footer-privacy"
            />
            <v-list-item
                v-bind="legalLinkProps(settings?.imprint_url, '/imprint')"
                prepend-icon="mdi-scale-balance"
                :title="$t('legal.imprint')"
                append-icon="mdi-chevron-right"
                data-testid="footer-imprint"
            />
            <v-list-item
                v-if="settings?.contact_email"
                :href="`mailto:${settings.contact_email}`"
                prepend-icon="mdi-email-outline"
                :title="$t('settings.contactEmail')"
                :subtitle="settings.contact_email"
                data-testid="footer-contact"
            />
            <NotificationsReleaseNotesDialog
                :tag="installedBase ? `v${installedBase}` : appVersionLabel"
                :notes="installedNotes"
                :published-at="installedPublishedAt"
                :commits="installedCommits"
                :repo-url="repoUrl"
                :installed-version="appVersionLabel"
                :error="error"
                :loading="loading"
                installed
            >
                <template #activator="{ props: activatorProps }">
                    <v-list-item
                        v-bind="activatorProps"
                        prepend-icon="mdi-tag-outline"
                        :title="$t('me.version')"
                        :subtitle="appVersionLabel"
                        append-icon="mdi-chevron-right"
                        data-testid="footer-version"
                    />
                </template>
            </NotificationsReleaseNotesDialog>
            <v-list-item
                prepend-icon="mdi-server-network"
                :title="$t('me.status')"
                data-testid="footer-health"
            >
                <v-list-item-subtitle class="info-list__status">
                    <span
                        class="info-list__dot"
                        :class="isHealthy ? 'info-list__dot--ok' : ''"
                    />
                    {{
                        isHealthy
                            ? $t('notifications.success.health')
                            : $t('notifications.error.health')
                    }}
                    · {{ $t('dashboard.online', [onlineCount]) }}
                </v-list-item-subtitle>
            </v-list-item>
        </v-list>
        <a
            class="info-list__copyright"
            href="https://github.com/tilalx/verti-grade"
            target="_blank"
            rel="noopener noreferrer"
        >
            © {{ new Date().getFullYear() }} verti-grade
        </a>
    </section>
</template>

<script setup lang="ts">
import type { SettingsRecord } from '~/types/models'
import { legalLinkProps } from '~/utils/legal'

defineProps<{ settings?: Partial<SettingsRecord> | null }>()

const {
    appVersionLabel,
    installedNotes,
    installedBase,
    installedPublishedAt,
    installedCommits,
    repoUrl,
    error,
    loading,
} = useVersionCheck()
const { isHealthy, onlineCount } = useAppStatus()
</script>

<style scoped>
.info-list__heading {
    margin: 24px 4px 8px;
    font-weight: 600;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.info-list__card {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.info-list__status {
    display: flex;
    align-items: center;
    gap: 6px;
}

.info-list__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgb(var(--v-theme-error));
}

.info-list__dot--ok {
    background: rgb(var(--v-theme-success));
}

.info-list__copyright {
    display: block;
    margin: 16px 0 8px;
    text-align: center;
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
    text-decoration: none;
}
</style>
