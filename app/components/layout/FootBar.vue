<template>
    <v-footer
        v-if="$route.meta.footer !== false"
        class="app-footer"
        elevation="0"
    >
        <div class="footer-inner">
            <!-- Left: legal links -->
            <div class="footer-left">
                <v-btn
                    v-bind="legalLinkProps(settings.privacy_url, '/privacy')"
                    variant="plain"
                    density="compact"
                    class="footer-link-btn"
                    data-testid="footer-privacy"
                >
                    {{ $t('legal.privacy') }}
                </v-btn>

                <span class="link-sep">·</span>

                <v-btn
                    v-bind="legalLinkProps(settings.imprint_url, '/imprint')"
                    variant="plain"
                    density="compact"
                    class="footer-link-btn"
                    data-testid="footer-imprint"
                >
                    {{ $t('legal.imprint') }}
                </v-btn>

                <span v-if="settings.contact_email" class="link-sep">·</span>

                <v-btn
                    v-if="settings.contact_email"
                    :href="`mailto:${settings.contact_email}`"
                    variant="plain"
                    density="compact"
                    class="footer-link-btn"
                    data-testid="footer-contact"
                >
                    {{ $t('settings.contactEmail') }}
                </v-btn>
            </div>

            <!-- Center: status pills -->
            <div class="footer-center">
                <div class="status-pill">
                    <span
                        class="status-dot"
                        :class="isHealthy ? 'dot--ok' : 'dot--err'"
                    />
                    <span class="status-label" data-testid="footer-health">{{
                        isHealthy
                            ? $t('notifications.success.health')
                            : $t('notifications.error.health')
                    }}</span>
                </div>

                <div class="status-pill">
                    <v-icon size="11">mdi-account-multiple-outline</v-icon>
                    <span class="status-label">{{
                        $t('dashboard.online', [onlineCount])
                    }}</span>
                </div>

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
                        <button
                            v-bind="activatorProps"
                            type="button"
                            class="status-pill status-pill--link"
                            data-testid="footer-version"
                        >
                            <v-icon size="11">mdi-tag-outline</v-icon>
                            <span class="status-label">{{
                                appVersionLabel
                            }}</span>
                        </button>
                    </template>
                </NotificationsReleaseNotesDialog>
            </div>

            <!-- Right: copyright -->
            <div class="footer-right">
                <v-btn
                    href="https://github.com/tilalx/verti-grade"
                    target="_blank"
                    variant="plain"
                    density="compact"
                    class="footer-brand-btn"
                >
                    © {{ currentYear }} verti-grade
                </v-btn>
            </div>
        </div>
    </v-footer>
</template>

<script setup lang="ts">
import type { SettingsRecord } from '~/types/models'
withDefaults(defineProps<{ settings?: Partial<SettingsRecord> }>(), {
    settings: () => ({}),
})

const pb = usePocketbase()
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
const currentYear = computed(() => new Date().getFullYear())

const legalLinkProps = (
    externalUrl: string | null | undefined,
    internalPath: string,
) =>
    externalUrl
        ? { href: externalUrl, target: '_blank', rel: 'noopener noreferrer' }
        : { to: internalPath }

const { data: health } = await useAsyncData(
    'footer:health',
    () => pb.health.check(),
    {
        default: () => null,
        lazy: true,
    },
)

const { data: online } = await useAsyncData(
    'footer:online',
    () => pb.send('/api/online', { method: 'GET' }),
    {
        default: () => ({ clients: 0 }),
        lazy: true,
    },
)

const isHealthy = computed(() => health.value?.code === 200)
const onlineCount = computed(() => (online.value?.clients ?? 0) + 1)
</script>

<style scoped>
.app-footer {
    flex: 0 0 auto;
    background: transparent;
    border-top: 1px solid rgba(var(--v-border-color), 0.08);
    padding: 0;
}

.footer-inner {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 10px 24px;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
}

/* ── Left ───────────────────────────────────────────────── */
.footer-left {
    display: flex;
    align-items: center;
    gap: 2px;
}

/* ── Center ─────────────────────────────────────────────── */
.footer-center {
    display: flex;
    align-items: center;
    gap: 6px;
}

.status-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 9px;
    border-radius: 999px;
    background: rgba(var(--v-theme-on-surface), 0.05);
    border: 1px solid rgba(var(--v-border-color), 0.08);
}

.status-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: rgba(var(--v-theme-on-surface), 0.55);
    white-space: nowrap;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
}

.dot--ok {
    background: rgb(var(--v-theme-success));
    box-shadow: 0 0 0 2px rgba(var(--v-theme-success), 0.2);
}

.dot--err {
    background: rgb(var(--v-theme-error));
    box-shadow: 0 0 0 2px rgba(var(--v-theme-error), 0.2);
}

/* ── Right ──────────────────────────────────────────────── */
.footer-right {
    display: flex;
    justify-content: flex-end;
}

/* ── Shared button styles ───────────────────────────────── */
.footer-link-btn {
    font-size: 13px;
    font-weight: 500;
    color: rgba(var(--v-theme-on-surface), 0.6);
    text-transform: none;
    min-width: unset;
    padding: 0 6px;
    letter-spacing: 0;
}

.footer-link-btn:hover {
    color: rgba(var(--v-theme-on-surface), 0.9);
}

.link-sep {
    font-size: 13px;
    color: rgba(var(--v-theme-on-surface), 0.35);
    user-select: none;
}

.footer-brand-btn {
    font-size: 11.5px;
    font-weight: 500;
    color: rgba(var(--v-theme-on-surface), 0.6);
    text-transform: none;
    min-width: unset;
    letter-spacing: 0;
}

.footer-brand-btn:hover {
    color: rgba(var(--v-theme-on-surface), 0.9);
}

.status-pill--link {
    text-decoration: none;
    cursor: pointer;
    transition: background 0.15s ease;
    font: inherit;
    appearance: none;
}

.status-pill--link:hover {
    background: rgba(var(--v-theme-on-surface), 0.09);
    border-color: rgba(var(--v-border-color), 0.18);
}

@media (max-width: 599px) {
    .footer-inner {
        grid-template-columns: 1fr;
        padding: 8px 16px;
        gap: 6px;
    }

    .footer-center {
        flex-wrap: wrap;
        justify-content: center;
        gap: 4px;
    }

    .footer-right {
        justify-content: center;
    }

    .footer-left {
        justify-content: center;
    }
}
</style>
